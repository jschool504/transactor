import express from 'express'
import fetch from 'node-fetch'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import SmsService from './services/sms-service'
import knex, { Knex } from 'knex'
import * as persistence from './lib/models/persistence'
import { memo } from './lib/utils'
import Settings, { SettingsManager } from './settings'
import MessageClient from './lib/interfaces/message-client'
import RootController from './controllers/root-controller'
import Scheduler from './controllers/scheduler'
import TelegramBot from 'node-telegram-bot-api'
import TelegramClient from './lib/clients/telegram-client'
import PlaidClient from './lib/clients/plaid-client'
import AccountClient from './lib/interfaces/account-client'
import AccountRepository from './lib/repositories/account-repository'
import TransactionService from './services/transaction-service'
import TransactionRequestRepository from './lib/repositories/transaction-request-repository'
import TransactionRequestService from './services/transaction-request-service'
import TransactionRepository from './lib/repositories/transaction-repository'
import SpendingService from './services/spending-service'
import BudgetService from './services/budget-service'
import BudgetRepository from './lib/repositories/budget-repository'
import ConsoleMessageClient from './lib/clients/console-message-client'
import MessageSender from './lib/interfaces/message-sender'
import ConsoleBot from './lib/clients/console-bot'
import dayjs from 'dayjs'
import { DayOfWeek } from './lib/models/enums'


const MINUTE = 60000
const HOUR = 3600000
const DAY = 1440000
const SECOND = 1000


export default class Context {
    env: string

    constructor(env: string) {
        this.env = env
    }

    @memo()
    getTelegramBot(): MessageSender {
        const bot = new TelegramBot(this.settings.TelegramToken, { polling: true })

        bot.on('text', async (msg) => {
            console.log(msg.text)
            const chatId = msg.chat.id
            await this.smsService.handle({
                message: msg.text || '',
                sms: chatId
            })
        })

        return bot
    }

    @memo()
    getConsoleBot(): MessageSender {
        const bot = new ConsoleBot(this)

        bot.on('text', async (msg) => {
            console.log(msg.text)
            await this.smsService.handle({
                message: msg.text || '',
                sms: 0
            })
        })

        return bot
    }

    get telegramBot(): MessageSender {
        return {
            prod: () => this.getTelegramBot(),
            dev: () => this.getConsoleBot()
        }[this.env]()
    }

    get fetch(): typeof fetch {
        return fetch
    }

    get smsClient(): MessageClient {
        return {
            prod: new TelegramClient(this),
            dev: new ConsoleMessageClient(this)
        }[this.env]
    }

    get smsService() {
        return new SmsService(this)
    }

    get pgCredentials(): Knex.StaticConnectionConfig  {
        return this.settings.DatabaseCredentials
    }

    @memo()
    _knex() {
        return knex({
            client: 'pg',
            connection: this.pgCredentials,
            // debug: true,
            pool: {
                afterCreate: async (connection, callback) => {
                    connection.query(`SET SESSION SCHEMA '${this.settings.DatabaseCredentials.schema}';`, function (err) {
                        callback(err, connection);
                    })
                }
            }
        })
    }

    get knex() {
        return this._knex()
    }

    get accountDbClient() {
        return this.knex<persistence.Account>('accounts')
    }

    get transactionRequestDbClient() {
        return this.knex<persistence.TransactionRequest>('transaction_requests')
    }

    get transactionsDbClient() {
        return this.knex<persistence.Transaction[]>('transactions')
    }

    get budgetDbClient() {
        return this.knex<persistence.Budget>('budgets')
    }

    get transactionRepository() {
        return new TransactionRepository(this)
    }

    get accountRepository() {
        return new AccountRepository(this)
    }

    get transactionRequestRepository() {
        return new TransactionRequestRepository(this)
    }

    get budgetRepository() {
        return new BudgetRepository(this)
    }

    get settings(): Settings {
        return new SettingsManager(this).get()
    }

    get plaidConfig(): Configuration {
        return new Configuration({
            basePath: PlaidEnvironments.development,
            baseOptions: {
                headers: {
                    'PLAID-CLIENT-ID': this.settings.PlaidClientId,
                    'PLAID-SECRET': this.settings.PlaidSecretKey
                }
            }
        })
    }

    get plaidApi(): PlaidApi {
        return new PlaidApi(this.plaidConfig)
    }

    get accountClient(): AccountClient {
        return new PlaidClient(this)
    }

    get transactionService(): TransactionService {
        return new TransactionService(this)
    }

    get transactionRequestService(): TransactionRequestService {
        return new TransactionRequestService(this)
    }

    get spendingService(): SpendingService {
        return new SpendingService(this)
    }

    get budgetService(): BudgetService {
        return new BudgetService(this)
    }

    get scheduler() {
        const scheduler = new Scheduler()

        this.smsClient.send('I just restarted!')

        scheduler.add({
            runOnStart: false,
            timezone: 'America/New_York',
            shouldRun: (now) => (
                now.minute() === 33
                && now.second() == 0
            ),
            function: async () => {
                await this.transactionService.fetchTransactions()
            }
        })

        scheduler.add({
            runOnStart: false,
            interval: 5 * SECOND,
            function: async () => {
                await this.transactionRequestService.processOpenRequests()
            }
        })

        scheduler.add({
            runOnStart: false,
            timezone: 'America/New_York',
            shouldRun: (now) => (
                now.hour() === 18
                && now.minute() === 30
                && now.second() === 0
            ),
            function: async () => {
                await this.spendingService.sendDailySpendingSummary()
            }
        })

        scheduler.add({
            runOnStart: false,
            at: 'T19:00:00',
            timezone: 'America/New_York',
            function: async () => {
                await this.spendingService.sendMonthlySpendingSummary()
            }
        })

        scheduler.add({
            runOnStart: true,
            interval: 1 * HOUR,
            function: async () => {
                await this.budgetService.verifyMonthlyBudgets()
            }
        })

        scheduler.add({
            runOnStart: true,
            interval: 30 * MINUTE,
            function: async () => {
                await this.budgetService.verifyDailyBudgets()
            }
        })

        return scheduler
    }

    get rootController() {
        return new RootController(this)
    }

    get server() {
        const server = express()

        server.use(express.json()) // for parsing application/json
        server.use(express.urlencoded({ extended: false })) // for parsing application/x-www-form-urlencoded

        server.use(express.static(__dirname + '/assets'))

        server.get('/', this.rootController.status.bind(this.rootController))
        server.post('/message', this.rootController.message.bind(this.rootController))

        // account auth flow
        server.get('/accounts/new', this.rootController.newAccountPage.bind(this.rootController))
        server.post('/accounts', this.rootController.createAccount.bind(this.rootController))

        return server
    }

    get app() {
        return {
            start: () => {
                this.telegramBot
                this.scheduler.start()
                this.server.listen(
                    this.settings.port,
                    () => console.log(`transactor running on ${this.settings.port}`)
                )
            }
        }
    }

}
