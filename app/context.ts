import fs from 'fs'
import express from 'express'
import https from 'https'
import fetch from 'node-fetch'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import SmsService from './services/sms-service'
import knex, { Knex } from 'knex'
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
import ConsoleMessageClient from './lib/clients/console-message-client'
import MessageSender from './lib/interfaces/message-sender'
import ConsoleBot from './lib/clients/console-bot'
import EmailReceptionService from './services/email-reception-service'
import { EmailReceiptIdentifier } from './lib/helpers/email-receipt-identifier'
import PersistedEvent from './lib/models/persistence/event'
import EventService from './services/event-service'
import EventRepository from './lib/repositories/event-repository'
import ReceiptRepository from './lib/repositories/receipt-repository'
import PersistedReceipt from './lib/models/persistence/receipt'
import PersistedAccount from './lib/models/persistence/account'
import PersistedTransactionRequest from './lib/models/persistence/transaction-request'
import PersistedTransaction from './lib/models/persistence/transaction'
import PersistedBudget from './lib/models/persistence/budget'
import ReceiptImageService from './services/receipt-image-service'
import Email from './lib/models/external/email'
import ReceiptParser from './lib/interfaces/receipt-parser'
import ReceiptEmailParser from './lib/helpers/receipt-parser'
import ReceiptImageParser from './lib/helpers/receipt-image-parser'
import MerchantRepository from './lib/repositories/merchant-repository'
import MerchantCategoryHelper from './lib/helpers/merchant-category-helper'
import BudgetReportRepository from './lib/repositories/budget-report-repository'
import PersistedBudgetReport from './lib/models/persistence/budget-report'
import { DayOfWeek } from './lib/models/enums'
import dayjs from 'dayjs'
import StatementService from './services/statement-service'


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
    getTelegramBot(env: string): MessageSender {
        const bot = new TelegramBot(this.settings.TelegramToken, { polling: true })

        bot.on('text', async (msg) => {
            console.log(msg.text)
            const chatId = msg.chat.id
            await this.smsService.handle({
                message: msg.text || '',
                sms: chatId
            })
        })

        bot.on('photo', async ({ chat, photo }) => {
            if (photo && photo.length) {
                const img = photo[photo.length - 1]
                const fileStream = await bot.getFileStream(img.file_id)
                const filePath = `./receipts/${img.file_id.toLowerCase()}.jpg`
                const stream = fs.createWriteStream(filePath)
                fileStream.on('data', stream.write.bind(stream))
                fileStream.on('end', () => {
                    stream.end()
                    this.smsService.handle({
                        message: filePath,
                        sms: chat.id
                    })
                })
            }
        })

        bot.on('message', async ({ chat, document }) => {
            console.log('handling message')
            if (document && document.mime_type === 'text/csv') {
                try {
                    // Handle CSV file
                    const fileStream = await bot.getFileStream(document.file_id)
                    const filePath = `./transactions/${document.file_id.toLowerCase()}.csv`
                    const stream = fs.createWriteStream(filePath)
                    fileStream.on('data', stream.write.bind(stream))
                    fileStream.on('end', () => {
                        stream.end()
                        this.smsService.handle({
                            message: filePath,
                            sms: chat.id
                        })
                    })
                } catch (e) {
                    console.error(e)
                }
            }
        })

        return bot
    }

    @memo()
    getConsoleBot(env: string): MessageSender {
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
            prod: () => this.getTelegramBot(this.env),
            dev: () => this.getConsoleBot(this.env)
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
    _knex(env: string) { // env passed in here to make sure it's reset because memo is global
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
        return this._knex(this.env)
    }

    get accountDbClient() {
        return this.knex<PersistedAccount>('accounts')
    }

    get transactionRequestDbClient() {
        return this.knex<PersistedTransactionRequest>('transaction_requests')
    }

    get transactionsDbClient() {
        return this.knex<PersistedTransaction[]>('transactions')
    }

    get budgetReportDbClient() {
        return this.knex<PersistedBudgetReport>('budget_reports')
    }

    get eventDbClient() {
        return this.knex<PersistedEvent>('events')
    }

    get receiptDbClient() {
        return this.knex<PersistedReceipt>('receipts')
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

    get budgetReportRepository() {
        return new BudgetReportRepository(this)
    }

    get eventRepository() {
        return new EventRepository(this)
    }

    get receiptRepository() {
        return new ReceiptRepository(this)
    }

    get merchantRepository() {
        return new MerchantRepository(this)
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

    get emailReceiptIdentifier(): EmailReceiptIdentifier {
        return new EmailReceiptIdentifier(this)
    }

    get receiptEmailParser(): ReceiptParser<Email> {
        return new ReceiptEmailParser(this)
    }

    get receiptImageParser(): ReceiptParser<string> {
        return new ReceiptImageParser(this)
    }

    get merchantCategoryHelper(): MerchantCategoryHelper {
        return new MerchantCategoryHelper(this)
    }

    get emailReceptionService(): EmailReceptionService {
        return new EmailReceptionService(this)
    }

    get receiptImageService(): ReceiptImageService {
        return new ReceiptImageService(this)
    }

    get statementService(): StatementService {
        return new StatementService(this)
    }

    @memo()
    eventHandlerRegistry(env: string) {
        return {
            'RECEIPT_EMAIL_RECEIVED': this.emailReceptionService
                .processReceiptEmailReceived
                .bind(this.emailReceptionService),
            'RECEIPT_IMAGE_RECEIVED': this.receiptImageService
                .processNewReceiptImage
                .bind(this.receiptImageService)
        }
    }

    get eventService(): EventService {
        return new EventService(this)
    }

    get scheduler() {
        const scheduler = new Scheduler()

        scheduler.add({
            runOnStart: false,
            at: 'T23:00:00',
            timezone: 'America/New_York',
            function: async () => {
                await this.spendingService.sendMonthlySpendingSummary()
            }
        })

        scheduler.add({
            runOnStart: false,
            // fixme
            shouldRun: (now) => now.day() == DayOfWeek.Sunday && now.format('HH:mm:ss:SSS') === '09:00:00:000',
            timezone: 'America/New_York',
            function: async () => {
                // since we run this on sunday, which is the first day of the week, we want to
                // go back 1 day to calculate reports for the previous week
                const yesterday = dayjs().subtract(1, 'day')
                await this.budgetService.generateBudgetReports(yesterday)
            }
        })

        scheduler.add({
            runOnStart: false,
            at: 'T17:00:00',
            timezone: 'America/New_York',
            function: async () => {
                await this.budgetService.verifyWeeklyBudgets(dayjs())
            }
        })

        scheduler.add({
            runOnStart: true,
            shouldRun: (now) => [0, 15, 30, 45].includes(now.second()),
            function: async () => {
                return await this.eventService.process()
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
        server.post('/emails', this.rootController.newEmail.bind(this.rootController))

        // account auth flow
        server.get('/accounts/new', this.rootController.newAccountPage.bind(this.rootController))
        server.post('/accounts', this.rootController.createAccount.bind(this.rootController))

        // receipt
        server.get('/receipts/new', this.rootController.newReceiptPage.bind(this.rootController))
        server.post('/api/receipts', this.rootController.createNewReceipt.bind(this.rootController))

        return server
    }

    @memo()
    tlsCredentials() {
        return {
            key: fs.readFileSync('/etc/letsencrypt/live/transactor.jeremyschool.io/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/transactor.jeremyschool.io/fullchain.pem'),
        }
    }

    get httpServer() {
        return {
            prod: () => https.createServer(this.tlsCredentials(), this.server),
            dev: () => this.server
        }[this.env]()
    }

    get app() {
        return {
            start: () => {
                this.telegramBot
                this.scheduler.start()
                this.httpServer.listen(
                    this.settings.port,
                    () => {
                        console.log(`transactor running on ${this.settings.port}`)
                        this.smsClient.send('Transactor restarted successfully!')
                    }
                )
            }
        }
    }

}
