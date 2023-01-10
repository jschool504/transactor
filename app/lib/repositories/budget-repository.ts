import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Budget } from '../models/persistence'
import { measure } from '../utils'

interface BudgetRepositoryContext {
    budgetDbClient: Knex.QueryBuilder<Budget>
}

const toPersisted = (domain: domain.Budget): Budget => ({
    // @ts-ignore
    id: domain.id && parseInt(domain.id),
    budget_id: domain.budgetId,
    allocation: domain.allocation,
    period: domain.period,
    name: domain.name
})

const toDomain = (persisted: Budget): domain.Budget => ({
    // @ts-ignore
    id: persisted.id && parseInt(persisted.id),
    budgetId: persisted.budget_id,
    // @ts-ignore
    allocation: parseInt(persisted.allocation),
    period: persisted.period,
    name: persisted.name
})

class BudgetRepository {

    constructor(
        private ctx: BudgetRepositoryContext
    ) {}

    @measure
    async insert(budget: domain.Budget): Promise<any> {
        return await this.ctx.budgetDbClient.insert(
            toPersisted(budget)
        )
    }

    @measure
    async update(budget: domain.Budget): Promise<any> {
        const persisted = toPersisted(budget)
        return await this.ctx.budgetDbClient.update(persisted).where('id', budget.id)
    }

    @measure
    async find(budget: domain.Budget): Promise<domain.Budget | null> {
        const persisted: Budget[] = await this.ctx.budgetDbClient
            .select()
            .where('budget_id', budget.budgetId)
            .where('period', budget.period)
            .limit(1)

        if (persisted.length) {
            return toDomain(persisted[0])
        }

        return null
    }

    @measure
    async all(): Promise<domain.Budget[]> {
        return (await this.ctx.budgetDbClient.select()).map(toDomain)
    }

    @measure
    async deleteByBudgetId(budgetId: string): Promise<domain.Budget | null> {
        const [budget] = await this.ctx.budgetDbClient
            .select()
            .where('budget_id', 'like', `%${budgetId}%`)
            .limit(1)
        if (!budget) {
            return null
        }
        await this.ctx.budgetDbClient.delete().where('id', budget.id)
        return budget
    }

}

export default BudgetRepository
