import { Knex } from 'knex'
import BudgetReport, { NewBudgetReport } from '../models/domain/budget-report'
import PersistedBudgetReport from '../models/persistence/budget-report'
import { measure } from '../utils'
import dayjs from 'dayjs'
import { ReceiptCategory } from '../models/enums'

interface BudgetReportRepositoryContext {
    budgetReportDbClient: Knex.QueryBuilder<PersistedBudgetReport>
}

const toPersisted = (domain: BudgetReport): PersistedBudgetReport => ({
    // @ts-ignore
    id: domain.id && parseInt(domain.id),
    created_at: domain.createdAt.toISOString(),
    category: domain.category,
    amount_spent: domain.amountSpent,
    budget_limit: domain.budgetLimit,
    rollover_amount: domain.rolloverAmount
})

const toDomain = (persisted: PersistedBudgetReport): BudgetReport => ({
    // @ts-ignore
    id: persisted.id && parseInt(persisted.id),
    createdAt: dayjs(persisted.created_at).tz('America/New_York'),
    // @ts-ignore
    category: parseInt(persisted.category),
    amountSpent: persisted.amount_spent,
    budgetLimit: persisted.budget_limit,
    rolloverAmount: persisted.rollover_amount
})

class BudgetReportRepository {

    constructor(
        private ctx: BudgetReportRepositoryContext
    ) {}

    @measure
    async insert(report: NewBudgetReport): Promise<any> {
        return await this.ctx.budgetReportDbClient.insert(
            toPersisted({
                ...report,
                createdAt: dayjs().tz('America/New_York')
            })
        )
    }

    @measure
    async rolloverAmountsByCategory(): Promise<{ category: ReceiptCategory, rolloverAmountSum: number }[]> {
        const persisted = await this.ctx.budgetReportDbClient
            .select('category')
            .sum({ rollover_amount_sum: 'rollover_amount' })
            .groupBy('category')

        return persisted
            .map(persisted => ({
                category: parseInt(persisted.category),
                rolloverAmountSum: parseInt(persisted.rollover_amount_sum)
            }))
    }

}

export default BudgetReportRepository
