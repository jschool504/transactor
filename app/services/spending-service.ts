import dayjs, { Dayjs } from 'dayjs'
import AccountClient from '../lib/interfaces/account-client'
import MessageClient from '../lib/interfaces/message-client'
import { Transaction } from '../lib/models/domain'
import { Category } from '../lib/models/external'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import { format } from '../lib/utils'

interface SpendingServiceContext {
    accountClient: AccountClient
    transactionRepository: TransactionRepository
    smsClient: MessageClient
    receiptRepository: ReceiptRepository
}

const BLACKLISTED_CATEGORIES = [
    'Transfer',
    'Payment',
    'Payroll',
    'Interest'
    // 'Loans and Mortgages'
]

const groupCategoriesById = (categories: Category[]): { [index: string]: Category } => categories
    .reduce(
        (grouped, category) => ({ ...grouped, [category.category_id]: category }),
        {}
    )

const summarizeSpendingByName = (names, transactionsByCategory, categories) => names
    .map(name => {
        const transactions = transactionsByCategory[name]
        const amount = transactions.reduce(
            (sum, tr) => sum + tr.amount,
            0
        )

        const category = categories[transactions[0].categoryId]

        const shouldIncludeTransaction = !BLACKLISTED_CATEGORIES
            .filter(value => category.hierarchy.includes(value)).length

        if (!shouldIncludeTransaction) {
            return null
        }

        const total = {
            location: name,
            category,
            amount
        }

        return total
    })
    .filter(x => !!x)

const summarizeSpendingByCategory = (
    transactionsByCategoryId: { [index: string]: Transaction[] },
    categories: { [index: string]: Category }
): { categoryId: string, amount: number, categoryName: string }[] => {
    const v = Object.entries(transactionsByCategoryId)
    return v.reduce((acc, [categoryId, transactions]) => {
        const amount = transactions.reduce(
            (sum, tr) => sum + tr.amount,
            0
        )

        const category = categories[categoryId]

        const shouldIncludeTransaction = !BLACKLISTED_CATEGORIES
            .filter(value => category.hierarchy.includes(value)).length

        if (!shouldIncludeTransaction) {
            return acc
        }

        return [
            ...acc,
            {
                categoryName: category.hierarchy[category.hierarchy.length - 1],
                categoryId,
                amount
            }
        ]
    }, [])
}

const totalSpending = (spendingByName) => spendingByName
    .reduce(
        (grandTotal, spending) => grandTotal + spending.amount,
        0
    )

/**
 * Service to track and report on spending
 */
class SpendingService {

    constructor(
        private ctx: SpendingServiceContext
    ) {}

    async dailySpendingSummary(day: Dayjs = dayjs()): Promise<string> {
        const amountsByMerchant = await this.ctx.receiptRepository.sumAmountByMerchantForDate(day)

        const total = amountsByMerchant.reduce((sum, { amount }) => sum + amount, 0)

        const totalStatement = `Hello! You spent ${format(total)} today.`
        const merchantStatements = amountsByMerchant
            .map(({ merchant, amount }) => `- ${format(amount)} at ${merchant}`)

        return [totalStatement, ...merchantStatements].join('\n')
    }

    async monthlySpendingSummary(day: Dayjs = dayjs()): Promise<string> {
        const amountsByMerchant = await this.ctx.receiptRepository.sumAmountByMerchantForMonth(day)

        const total = amountsByMerchant.reduce((sum, { amount }) => sum + amount, 0)

        const totalStatement = `Hello! You spent ${format(total)} this month.`
        const merchantStatements = amountsByMerchant
            .map(({ merchant, amount }) => `- ${format(amount)} at ${merchant}`)

        return [totalStatement, ...merchantStatements].join('\n')
    }

    async sendDailySpendingSummary() {
        await this.ctx.smsClient.send(await this.dailySpendingSummary(), false)
    }

    async sendMonthlySpendingSummary() {
        await this.ctx.smsClient.send(await this.monthlySpendingSummary(), false)
    }

}

export default SpendingService
