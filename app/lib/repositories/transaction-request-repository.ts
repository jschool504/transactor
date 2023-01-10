import dayjs from 'dayjs'
import { Knex } from 'knex'
import * as domain from '../models/domain'
import { TransactionRequest } from '../models/persistence'
import { measure } from '../utils'

interface TransactionRequestRepositoryContext {
    transactionRequestDbClient: Knex.QueryBuilder<TransactionRequest>
}


const toPersisted = (domain: domain.TransactionRequest): TransactionRequest => ({
    id: domain.id,
    account_id: domain.accountId,
    next_cursor: domain.nextCursor,
    open: domain.open
})

const toDomain = (persisted: TransactionRequest): domain.TransactionRequest => ({
    id: persisted.id,
    accountId: persisted.account_id,
    nextCursor: persisted.next_cursor,
    open: persisted.open
})


class TransactionRequestRepository {
    private ctx: TransactionRequestRepositoryContext

    constructor(ctx: TransactionRequestRepositoryContext) {
        this.ctx = ctx
    }

    @measure
    async insert(request: domain.TransactionRequest) {
        return await this.ctx.transactionRequestDbClient.insert(
            toPersisted(request)
        )
    }

    @measure
    async open(): Promise<domain.TransactionRequest[]> {
        return (await this.ctx.transactionRequestDbClient.select()).map(toDomain)
    }

    // @measure
    async setClosed(request: domain.TransactionRequest) {
        const persisted = toPersisted({
            ...request,
            open: false
        })
        return await this.ctx.transactionRequestDbClient
            .update(persisted)
            .where('id', persisted.id)
    }

    @measure
    async setNextCursor(request: domain.TransactionRequest, nextCursor: string) {
        const persisted = toPersisted({
            ...request,
            nextCursor
        })
        return await this.ctx.transactionRequestDbClient
            .update(persisted)
            .where('id', persisted.id)
    }

}

export default TransactionRequestRepository
