import dayjs from 'dayjs'
import MessageClient from '../lib/interfaces/message-client'
import { Budget, Transaction } from '../lib/models/domain'
import { OperationType } from '../lib/models/enums'
import BudgetRepository from '../lib/repositories/budget-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import { convertNameToBudgetId, format } from '../lib/utils'

interface BudgetServiceContext {
    budgetRepository: BudgetRepository
    transactionRepository: TransactionRepository
    smsClient: MessageClient
}


const groupBy = (transactions, field) => transactions
    .reduce((grouped, transaction) => {
        return {
            ...grouped,
            [field]: [...(grouped[field] || []), transaction]
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

class BudgetService {

    constructor(
        private ctx: BudgetServiceContext
    ) {}

    async setBudget(name: string, allocation: number, period: string): Promise<OperationType> {
        const isValidPeriod = ['daily', 'monthly'].includes(period)
        if (!isValidPeriod) {
            return OperationType.NOOP
        }

        // FIXME: potentially rather memory intensive, should probably store this on
        // the sql record, but i don't feel like it right now
        const matchingTransactions = (await this.ctx.transactionRepository.all())
            .filter(transaction => convertNameToBudgetId(transaction.name).includes(convertNameToBudgetId(name)))

        // warning - this means you have to buy something from a place prior to setting a budget for it!
        if (!matchingTransactions.length) {
            return OperationType.NOOP
        }

        const potential: Budget = {
            budgetId: convertNameToBudgetId(name),
            allocation: Math.floor(allocation * 100),
            period,
            name: matchingTransactions[0].name
        }

        const existing = await this.ctx.budgetRepository.find(potential)

        if (existing) {
            await this.ctx.budgetRepository.update({
                ...existing,
                ...potential
            })
            return OperationType.UPDATE
        }

        await this.ctx.budgetRepository.insert({
            ...existing,
            ...potential
        })

        return OperationType.CREATE
    }

    async verifyMonthlyBudgets() {
        const budgets = await this.ctx.budgetRepository.all()
        const transactions = await this.ctx.transactionRepository.forMonth(dayjs('2022-11-30'))
        const monthlyTransactionsByName: { [index: string]: Transaction[] } = groupBy(transactions, 'name')

        calculateExceededBudgets(monthlyTransactionsByName, budgets)
            .map(toMessage)
            .forEach(this.ctx.smsClient.send)

    }

    async verifyDailyBudgets() {
        const budgets = await this.ctx.budgetRepository.all()
        const transactions = await this.ctx.transactionRepository.forDate(dayjs())
        const dailyTransactionsByName: { [index: string]: Transaction[] } = groupBy(transactions, 'name')

        calculateExceededBudgets(dailyTransactionsByName, budgets)
            .map(toMessage)
            .forEach(this.ctx.smsClient.send)

    }

}

export default BudgetService
