import dayjs, { Dayjs } from 'dayjs'
import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Transaction } from '../models/persistence'
import { measure } from '../utils'

interface TransactionRepositoryContext {
    transactionsDbClient: Knex.QueryBuilder<Transaction[]>
}


const toPersisted = (domain: domain.Transaction): Transaction => ({
    id: domain.id,
    account_id: domain.accountId,
    transaction_id: domain.transactionId,
    amount: domain.amount,
    name: domain.name,
    date: domain.date.format('YYYY-MM-DD'),
    merchant_name: domain.merchantName,
    category_id: domain.categoryId,
    transaction_request_id: domain.transactionRequestId
})

const toDomain = (persisted: Transaction): domain.Transaction => ({
    id: persisted.id,
    accountId: persisted.account_id,
    transactionId: persisted.transaction_id,
    // FIXME
    // @ts-ignore
    amount: parseInt(persisted.amount),
    name: persisted.name,
    date: dayjs(persisted.date),
    merchantName: persisted.merchant_name,
    categoryId: persisted.category_id,
    transactionRequestId: persisted.transaction_request_id
})


class TransactionRepository {
    private ctx: TransactionRepositoryContext

    constructor(ctx: TransactionRepositoryContext) {
        this.ctx = ctx
    }

    @measure
    async insert(transactions: domain.Transaction[]) {
        return await this.ctx.transactionsDbClient
            .insert(
                transactions.map(toPersisted)
            )
    }

    @measure
    async all(): Promise<domain.Transaction[]> {
        return (await this.ctx.transactionsDbClient.select()).map(toDomain)
    }

    @measure
    async byName(name: string): Promise<domain.Transaction[]> {
        return (await this.ctx.transactionsDbClient
            .select()
            .where('name', 'like', `%${name}%`))
            .map(toDomain)
    }

    @measure
    async forMonth(date: Dayjs): Promise<domain.Transaction[]> {
        return (await this.ctx.transactionsDbClient
            .select()
            .where('date', 'like', `%${date.format('YYYY-MM')}%`))
            .map(toDomain)
    }

    @measure
    async forDate(date: Dayjs): Promise<domain.Transaction[]> {
        return (await this.ctx.transactionsDbClient
            .select()
            .whereNotNull('category_id')
            .where('date', date.format('YYYY-MM-DD')))
            .map(toDomain)
    }

    @measure
    async byCategoryForDate(date: Dayjs): Promise<{ [index: string]: domain.Transaction[] }> {
        const persisted = (await this.ctx.transactionsDbClient
            .select()
            .whereNotNull('category_id')
            .where('date', date.format('YYYY-MM-DD')))

        return persisted.map(toDomain).reduce(
            (grouped, transaction) => {
                return {
                    ...grouped,
                    [transaction.categoryId]: [
                        ...(grouped[transaction.categoryId] || []),
                        transaction
                    ]
                }
            },
            {}
        )
    }

    @measure
    async byNameForDate(date: Dayjs): Promise<{ [index: string]: domain.Transaction[] }> {
        const persisted = (await this.ctx.transactionsDbClient
            .select()
            .where('date', date.format('YYYY-MM-DD')))

        return persisted.map(toDomain).reduce(
            (grouped, transaction) => {
                return {
                    ...grouped,
                    [transaction.name]: [
                        ...(grouped[transaction.name] || []),
                        transaction
                    ]
                }
            },
            {}
        )
    }

    @measure
    async byCategoryForMonth(date: Dayjs): Promise<{ [index: string]: domain.Transaction[] }> {
        const persisted = (await this.ctx.transactionsDbClient
            .select()
            .where('date', 'like',`${date.format('YYYY-MM')}%`))

        return persisted.map(toDomain).reduce(
            (grouped, transaction) => {
                return {
                    ...grouped,
                    [transaction.categoryId]: [
                        ...(grouped[transaction.categoryId] || []),
                        transaction
                    ]
                }
            },
            {}
        )
    }

    @measure
    async forAccountId(accountId: string): Promise<domain.Transaction[]> {
        const persisted = (await this.ctx.transactionsDbClient
            .select()
            .where('account_id', accountId))

        return persisted.map(toDomain)
    }

}

export default TransactionRepository
