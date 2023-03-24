import Settings from '../settings'
import MessageClient from '../lib/interfaces/message-client'
import { measure } from '../lib/utils'
import AccountRepository from '../lib/repositories/account-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionService from './transaction-service'
import SpendingService from './spending-service'
import dayjs from 'dayjs'
import ReceiptImageService from './receipt-image-service'
import ReceiptRepository from '../lib/repositories/receipt-repository'

interface SmsServiceContext {
    smsClient: MessageClient
    settings: Settings
    accountRepository: AccountRepository
    transactionRepository: TransactionRepository
    transactionService: TransactionService
    spendingService: SpendingService
    receiptImageService: ReceiptImageService
    receiptRepository: ReceiptRepository
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
    isSendDailySummary: (message: string) => message.includes('daily') && message.includes('summary'),
    isSendTodaysSummary: (message: string) => message.includes('today') && message.includes('summary'),
    isSendYesterdaysSummary: (message: string) => message.includes('yesterday') && message.includes('summary'),
    isSendLastMonthlySummary: (message: string) => message.includes('last') && message.includes('monthly') && message.includes('summary'),
    isSendMonthlySummary: (message: string) => message.includes('monthly') && message.includes('summary'),
    isRefreshTransactions: (message: string) => message.includes('refresh transactions'),
    isNewReceiptImage: (message: string) => message.startsWith('./receipts') && message.endsWith('.jpg'),
    isAddNewReceipt: (message: string) => (message.includes('new') || message.includes('add')) && (message.includes('receipt') || message.includes('transaction')),
    isTransactionDump: (message: string) => message.startsWith('./transactions') && message.endsWith('.csv')
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
    sendDailySummary: handleError(async (message: string) => {
        const m = message.match(/(?<=for\s)(\d{4})\-(\d{2})\-(\d{2})/)
        if (m && m.length) {
            const [date] = m
            const day = dayjs(date)
            return await ctx.spendingService.dailySpendingSummary(day)
        }
        return await ctx.spendingService.dailySpendingSummary()
    }),
    sendTodaysSummary: handleError(async () => {
        const today = dayjs()
            .set('hour', 0)
            .set('minute', 0)
            .set('second', 0)
            .set('millisecond', 0)
        return await ctx.spendingService.dailySpendingSummary(today)
    }),
    sendYesterdaysSummary: handleError(async () => {
        return await ctx.spendingService.dailySpendingSummary(dayjs().subtract(1, 'day'))
    }),
    sendLastMonthlySummary: handleError(async () => {
        return await ctx.spendingService.monthlySpendingSummary(dayjs().subtract(1, 'month'))
    }),
    sendMonthlySummary: handleError(async (message: string) => {
        const m = message.match(/(for)\s(.+)\s(\d{4})/)
        if (m && m.length) {
            const [_, __, month, year] = m
            const day = dayjs()
                .set('year', parseInt(year))
                .set('month', Months[month.toLowerCase()])

            return await ctx.spendingService.monthlySpendingSummary(day)
        }
        return await ctx.spendingService.monthlySpendingSummary()
    }),
    enqueueNewReceiptImageForProcessing: handleError(async (imagePath: string) => {
        await ctx.receiptImageService.handleNewReceiptImage(imagePath)
        return 'Got it! I\'ll let you know when I\'ve processed this receipt'
    }),
    addReceipt: handleError(async (message: string) => `[Add receipt](${ctx.settings.origin}/receipts/new)`),
    handleTransactionDump: handleError(async (transPath: string) => transPath)
})


export default class SmsService {

    constructor(
        private ctx: SmsServiceContext
    ) {}

    @measure
    async handle(event: SmsEvent) {

        const response = await Match<string, Promise<string | null>>(event.message.toLowerCase())(
            [MessageIdentifiers.isSendDailySummary, Operations(this.ctx).sendDailySummary],
            [MessageIdentifiers.isSendTodaysSummary, Operations(this.ctx).sendTodaysSummary],
            [MessageIdentifiers.isSendYesterdaysSummary, Operations(this.ctx).sendYesterdaysSummary],
            [MessageIdentifiers.isSendLastMonthlySummary, Operations(this.ctx).sendLastMonthlySummary],
            [MessageIdentifiers.isSendMonthlySummary, Operations(this.ctx).sendMonthlySummary],
            [MessageIdentifiers.isNewReceiptImage, Operations(this.ctx).enqueueNewReceiptImageForProcessing],
            [MessageIdentifiers.isAddNewReceipt, Operations(this.ctx).addReceipt],
            [MessageIdentifiers.isTransactionDump, Operations(this.ctx).handleTransactionDump],
            [Always, async () => 'Sorry! Not sure what you asked :('],
        )

        if (response) {
            return await this.ctx.smsClient.send(response, true)
        }

    }

}
