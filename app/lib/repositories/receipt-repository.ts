import dayjs from 'dayjs'
import { Knex } from 'knex'
import Receipt, { NewReceipt } from '../models/domain/receipt'
import PersistedReceipt from '../models/persistence/receipt'

interface ReceiptRepositoryContext {
    receiptDbClient: Knex.QueryBuilder<PersistedReceipt>
}

const toPersisted = (domain: Receipt): PersistedReceipt => ({
    id: domain.id,
    created_at: domain.createdAt.toISOString(),
    transaction_date: domain.transactionDate.toISOString(),
    merchant: domain.merchant,
    amount: domain.amount,
    raw_receipt: domain.rawReceipt
})

const toDomain = (persisted: PersistedReceipt): Receipt => ({
    id: persisted.id,
    createdAt: dayjs(persisted.created_at).tz('America/New_York'),
    transactionDate: dayjs(persisted.transaction_date).tz('America/New_York'),
    merchant: persisted.merchant,
    amount: persisted.amount,
    rawReceipt: persisted.raw_receipt
})

class ReceiptRepository {
    constructor(
        private ctx: ReceiptRepositoryContext
    ) {}

    async insert(receipt: NewReceipt) {
        return await this.ctx.receiptDbClient.insert(
            toPersisted({
                ...receipt,
                createdAt: dayjs().tz('America/New_York')
            })
        )
    }

}


export default ReceiptRepository
