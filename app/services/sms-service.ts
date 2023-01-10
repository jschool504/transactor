import Settings from '../settings'
import MessageClient from '../lib/interfaces/message-client'
import { format, measure } from '../lib/utils'
import AccountRepository from '../lib/repositories/account-repository'
import BudgetService from './budget-service'
import { OperationType } from '../lib/models/enums'
import BudgetRepository from '../lib/repositories/budget-repository'
import budgetRepository from '../lib/repositories/budget-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionService from './transaction-service'
import SpendingService from './spending-service'
import dayjs from 'dayjs'

interface SmsServiceContext {
    smsClient: MessageClient
    settings: Settings
    accountRepository: AccountRepository
    budgetService: BudgetService
    budgetRepository: BudgetRepository
    transactionRepository: TransactionRepository
    transactionService: TransactionService
    spendingService: SpendingService
}


interface SmsEvent {
    message: string
    sms: string | number
}


const ERROR_MESSAGE = 'Sorry, something went wrong - please try again later!'


type ConditionalFunction<T> = (value: T) => boolean
type ExecutorFunction<T, V> = (value: T) => V
const Identity = <T>(value: T) => value
const Always = <T>(value: T) => true
const Never = <T>(value: T) => false

function Match<T, V>(value: T) {
    function thing(...args: [ConditionalFunction<T>, ExecutorFunction<T, V>][]): V {
        for (const [conditional, executor] of args) {
            if (conditional(value)) {
                return executor(value)
            }
        }
    }
    return thing
}


const MessageIdentifiers = {
    isAddNewAccount: (message: string) => message.includes('add') && message.includes('account'),
    isListAccounts: (message: string) => message.includes('list') && message.includes('account'),
    isSetBudget: (message: string) => message.includes('set') && message.includes('budget'),
    isDeleteBudget: (message: string) => message.includes('delete') && message.includes('budget'),
    isListBudgets: (message: string) => message.includes('budgets'),
    isSendDailySummary: (message: string) => message.includes('daily') && message.includes('summary'),
    isSendTodaysSummary: (message: string) => message.includes('today') && message.includes('summary'),
    isSendYesterdaysSummary: (message: string) => message.includes('yesterday') && message.includes('summary'),
    isSendLastMonthlySummary: (message: string) => message.includes('last') && message.includes('monthly') && message.includes('summary'),
    isSendMonthlySummary: (message: string) => message.includes('monthly') && message.includes('summary'),
    isRefreshTransactions: (message: string) => message.includes('refresh transactions')
}

const Months = {
    'january': 0,
    'jan': 0,
    'february': 1,
    'feb': 1,
    'march': 2,
    'mar': 2,
    'april': 3,
    'apr': 3,
    'may': 4,
    'june': 5,
    'july': 6,
    'august': 7,
    'aug': 7,
    'september': 8,
    'sept': 8,
    'sep': 8,
    'october': 9,
    'oct': 9,
    'november': 10,
    'nov': 10,
    'december': 11,
    'dec': 11,
}


const handleError = (func: ExecutorFunction<string, Promise<string>>): ExecutorFunction<string, Promise<string>> =>
    async (message: string): Promise<string> => {
        try {
            return await func(message)
        } catch (e) {
            console.error(e)
            return Promise.resolve(ERROR_MESSAGE)
        }
    }

const Operations = (ctx: SmsServiceContext): { [key: string]: ExecutorFunction<string, Promise<string>> } => ({
    addNewAccount: handleError(async (message: string) => {
        return `Click this link to add your account [Add New Account](http://${ctx.settings.HostName}:${ctx.settings.port}/accounts/new)`
    }),
    listAccounts: handleError(async (message: string) => {
        const accounts = (await ctx.accountRepository.all())
            .map(account => `- *${account.institution}* account ending in *${account.mask}*`)
        return `Here are your accounts:\n` + accounts.join('\n')
    }),
    setBudget: handleError(async (message: string) => {
        const [nameStr] = message.match(/\".+\"/g)
        const [amountStr] = message.match(/\$\d+/)

        const daily = message.search(/(daily)/) > -1 ? 'daily' : null
        const weekly = message.search(/(weekly)/) > -1 ? 'weekly' : null
        const monthly = message.search(/(monthly)/) > -1 ? 'monthly' : null

        const name = nameStr.replace('"', '').replace('"', '')
        const amount = parseInt(amountStr.replace('$', ''))

        try {
            const operationType = await ctx.budgetService.setBudget(name, amount, daily || weekly || monthly)

            return {
                [OperationType.CREATE]: 'Budget added!',
                [OperationType.UPDATE]: 'Budget updated!',
                [OperationType.NOOP]: 'Sorry, couldn\'t add that budget for some reason! Make sure you entered a valid period (daily or monthly) and that you\'ve purchased something from this location previously.'
            }[operationType]
        } catch (e) {
            console.error(e)
        }
    }),
    listBudgets: handleError(async (message: string) => {
        return (await ctx.budgetRepository.all())
            .map(budget => `${budget.name} - ${format(budget.allocation)}/${budget.period}`)
            .join('\n')
    }),
    deleteBudget: handleError(async (message: string) => {
        const result = message.match(/\"[a-zA-Z]+\"/)
        if (!result) {
            return 'Sorry, not sure what you asked!'
        }

        const partialBudgetId = Array.from(result[0]).filter(c => c !== '"').join('')
        const budget = await ctx.budgetRepository.deleteByBudgetId(partialBudgetId)

        if (budget) {
            return `Deleted ${format(budget.allocation)}/${budget.period} budget for ${budget.name}`
        } else {
            return `No budget found for "${partialBudgetId}"`
        }
    }),
    sendDailySummary: handleError(async (message: string) => {
        const m = message.match(/(?<=for\s)(\d{4})\-(\d{2})\-(\d{2})/)
        if (m.length) {
            const [date] = m
            const day = dayjs(date)
            return await ctx.spendingService.dailySpendingSummary(day)
        }
        return await ctx.spendingService.dailySpendingSummary()
    }),
    sendTodaysSummary: handleError(async () => {
        return await ctx.spendingService.dailySpendingSummary()
    }),
    sendYesterdaysSummary: handleError(async () => {
        return await ctx.spendingService.dailySpendingSummary(dayjs().subtract(1, 'day'))
    }),
    sendLastMonthlySummary: handleError(async () => {
        return await ctx.spendingService.monthlySpendingSummary(dayjs().subtract(1, 'month'))
    }),
    sendMonthlySummary: handleError(async (message: string) => {
        const m = message.match(/(for)\s(.+)\s(\d{4})/)
        if (m.length) {
            const [_, __, month, year] = m
            const day = dayjs()
                .set('year', parseInt(year))
                .set('month', Months[month.toLowerCase()])

            return await ctx.spendingService.monthlySpendingSummary(day)
        }
        return await ctx.spendingService.monthlySpendingSummary()
    }),
    refreshTransactions: handleError(async (message: string) => {
        await ctx.transactionService.fetchTransactions()
        return 'Refreshing transactions...'
    })
})


export default class SmsService {

    constructor(
        private ctx: SmsServiceContext
    ) {}

    @measure
    async handle(event: SmsEvent) {

        const response = await Match<string, Promise<string | null>>(event.message.toLowerCase())(
            [MessageIdentifiers.isAddNewAccount, Operations(this.ctx).addNewAccount],
            [MessageIdentifiers.isListAccounts, Operations(this.ctx).listAccounts],
            [MessageIdentifiers.isSetBudget, Operations(this.ctx).setBudget],
            [MessageIdentifiers.isDeleteBudget, Operations(this.ctx).deleteBudget],
            [MessageIdentifiers.isListBudgets, Operations(this.ctx).listBudgets],
            [MessageIdentifiers.isSendDailySummary, Operations(this.ctx).sendDailySummary],
            [MessageIdentifiers.isSendTodaysSummary, Operations(this.ctx).sendTodaysSummary],
            [MessageIdentifiers.isSendYesterdaysSummary, Operations(this.ctx).sendYesterdaysSummary],
            [MessageIdentifiers.isSendLastMonthlySummary, Operations(this.ctx).sendLastMonthlySummary],
            [MessageIdentifiers.isSendMonthlySummary, Operations(this.ctx).sendMonthlySummary],
            [MessageIdentifiers.isRefreshTransactions, Operations(this.ctx).refreshTransactions],
            [Always, async () => 'Sorry! Not sure what you asked :('],
        )

        if (response) {
            return await this.ctx.smsClient.send(response, true)
        }

    }

}
