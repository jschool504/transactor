import dayjs from 'dayjs'
import { Knex } from 'knex'
import * as domain from '../models/domain'
import { TransactionRequest } from '../models/persistence'
import { measure } from '../utils'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

interface TransactionRequestRepositoryContext {
    transactionRequestDbClient: Knex.QueryBuilder<TransactionRequest>
}


const toPersisted = (domain: domain.TransactionRequest): TransactionRequest => ({
    id: domain.id,
    account_id: domain.accountId,
    next_cursor: domain.nextCursor,
    open: domain.open,
    started_at: domain.startedAt.toISOString(),
    completed_at: domain.completedAt && domain.completedAt.toISOString()
})

const toDomain = (persisted: TransactionRequest): domain.TransactionRequest => ({
    id: persisted.id,
    accountId: persisted.account_id,
    nextCursor: persisted.next_cursor,
    open: persisted.open,
    startedAt: dayjs(persisted.started_at).tz('America/New_York'),
    completedAt: persisted.completed_at && dayjs(persisted.completed_at).tz('America/New_York')
})


class TransactionRequestRepository {
    private ctx: TransactionRequestRepositoryContext

    constructor(ctx: TransactionRequestRepositoryContext) {
        this.ctx = ctx
    }

    @measure
    async insert(request: domain.NewTransactionRequest) {
        return await this.ctx.transactionRequestDbClient.insert(
            toPersisted({
                ...request,
                startedAt: dayjs().tz('America/New_York')
            })
        )
    }

    @measure
    async open(): Promise<domain.TransactionRequest[]> {
        return (
            await this.ctx.transactionRequestDbClient
                .select()
                .where('open', true)
        ).map(toDomain)
    }

    // @measure
    async setClosed(request: domain.TransactionRequest) {
        const persisted = toPersisted({
            ...request,
            open: false,
            completedAt: dayjs().tz('America/New_York')
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
