import dayjs, { Dayjs } from 'dayjs'
import MessageClient from '../lib/interfaces/message-client'
import Receipt from '../lib/models/domain/receipt'
import { ReceiptCategory } from '../lib/models/enums'
import BudgetReportRepository from '../lib/repositories/budget-report-repository'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import { format, measure, screamingSnakeToTitleCase, terminal } from '../lib/utils'

interface BudgetServiceContext {
    budgetReportRepository: BudgetReportRepository
    smsClient: MessageClient
    receiptRepository: ReceiptRepository
}

enum BudgetPeriod {
    Weekly,
    Monthly
}

// weekly
const BUDGETS = [
    {
        category: ReceiptCategory.GROCERIES,
        period: BudgetPeriod.Weekly,
        rollover: true,
        limit: 10000,
    },
    {
        category: ReceiptCategory.FAST_FOOD,
        period: BudgetPeriod.Weekly,
        rollover: true,
        limit: 3000,
    },
    {
        category: ReceiptCategory.COFFEE,
        period: BudgetPeriod.Weekly,
        rollover: true,
        limit: 3000,
    },
    {
        category: ReceiptCategory.AUTO_INSURANCE,
        period: BudgetPeriod.Weekly,
        rollover: true,
        limit: 60000,
    },
    {
        category: ReceiptCategory.AUTO_MAINTENANCE,
        period: BudgetPeriod.Weekly,
        rollover: true,
        limit: 10000,
    }
]


const groupBy = (receipts: Receipt[], field: string): { [index: number]: Receipt[] } => receipts
    .reduce((grouped, receipt) => {
        return {
            ...grouped,
            [receipt[field]]: [...(grouped[field] || []), receipt]
        }
    }, {})

const toMessage = (budget) => `You\'ve exceeded your ${budget.period} budget for ${budget.name} by ${format(budget.spent - budget.allocation)}!`

const calculateExceededBudgets = (groupedTransactions, budgets) => {
    return budgets.map(budget => {

        const transactions = groupedTransactions[budget.name] || []
        const spent = transactions
            .reduce((sum, transaction) => sum + transaction.amount, 0)

        return {
            name: transactions.length ? transactions[0].name : null,
            allocation: budget.allocation,
            period: budget.period,
            spent
        }

    })
    .filter(budget => budget.spent >= budget.allocation)
}

const lookupBudgetLimit = (category: ReceiptCategory) => {
    const budget = BUDGETS.find(b => b.category === category)
    return budget ? budget.limit : Number.MAX_SAFE_INTEGER
}

class BudgetService {

    constructor(
        private ctx: BudgetServiceContext
    ) {}

    // gets receipts for the given week and generates budget reports
    @measure
    async generateBudgetReports(date: Dayjs) {
        const receiptsForWeek = await this.ctx.receiptRepository.forWeekOf(date)
        const receiptsByCategory = groupBy(receiptsForWeek, 'category')

        const totalByCategory = Object.keys(receiptsByCategory)
            .map((categoryStr: string) => {
                const category = parseInt(categoryStr)
                const receiptsByCategoryForWeek = receiptsByCategory[category]
                const total = receiptsByCategoryForWeek.reduce((sum, r) => sum + r.amount, 0)
                return { category, total }
            })

        await Promise.all(Object.keys(receiptsByCategory).map(async categoryS => {
            const category = parseInt(categoryS)

            const amountSpent = totalByCategory.find(t => t.category === category).total
            const budgetLimit = lookupBudgetLimit(category)

            return await this.ctx.budgetReportRepository.insert({
                category,
                amountSpent,
                budgetLimit,
                rolloverAmount: budgetLimit !== Number.MAX_SAFE_INTEGER ? budgetLimit - amountSpent : 0
            })
        }))

    }

    // gets receipts for the current week and determines if any budgets have been exceeded
    // if so, sends a notification. factors in rollover amounts from previous weeks
    @measure
    async verifyWeeklyBudgets(date: Dayjs) {
        const receiptsForWeek = await this.ctx.receiptRepository.forWeekOf(date)

        const receiptsByCategory = groupBy(receiptsForWeek, 'category')

        const rolloverAmounts =  await this.ctx.budgetReportRepository.rolloverAmountsByCategory()
        const lookupRolloverAmount = (category: ReceiptCategory) => {
            const rollover = rolloverAmounts.find(r => r.category === category)
            return rollover ? rollover.rolloverAmountSum : 0
        }

        const totalByCategory = Object.keys(receiptsByCategory)
            .map((categoryStr: string) => {
                const category = parseInt(categoryStr)
                const receiptsByCategoryForWeek = receiptsByCategory[category]
                const total = receiptsByCategoryForWeek.reduce((sum, r) => sum + r.amount, 0)
                return { category, total }
            })

        const exceeded = totalByCategory
            .filter(t => {
                const limit = lookupBudgetLimit(t.category)
                const rollover = lookupRolloverAmount(t.category)
                return t.total > (rollover + limit)
            })

        const message = exceeded
            .map(e => {
                const recasedCategoryName = screamingSnakeToTitleCase(ReceiptCategory[e.category])
                return `You've exceeded your weekly budget for ${recasedCategoryName}!`
            })
            .join('\n')
    
        this.ctx.smsClient.send(message)

    }

}

export default BudgetService
