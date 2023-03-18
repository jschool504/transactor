import dayjs, { Dayjs } from 'dayjs'
import { Knex } from 'knex'
import Receipt, { NewReceipt } from '../models/domain/receipt'
import { ReceiptCategory } from '../models/enums'
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
    raw_receipt: domain.rawReceipt,
    category: domain.category
})

const toPersistedUpdate = (domain: Receipt): PersistedReceipt => ({
    created_at: domain.createdAt.toISOString(),
    transaction_date: domain.transactionDate.toISOString(),
    merchant: domain.merchant,
    amount: domain.amount,
    raw_receipt: domain.rawReceipt,
    category: domain.category
})

const toDomain = (persisted: PersistedReceipt): Receipt => ({
    id: persisted.id,
    createdAt: dayjs(persisted.created_at).tz('America/New_York'),
    transactionDate: dayjs(persisted.transaction_date).tz('America/New_York'),
    merchant: persisted.merchant,
    // @ts-ignore
    amount: parseInt(persisted.amount),
    rawReceipt: persisted.raw_receipt,
    // @ts-ignore
    category: parseInt(persisted.category)
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

    async update(receipt: Receipt) {
        return await this.ctx.receiptDbClient.update(
            toPersistedUpdate(receipt)
        ).where('id', receipt.id)
    }

    async all(): Promise<Receipt[]> {
        return (await this.ctx.receiptDbClient.select())
            .map(toDomain)
    }

    async forMonth(date: Dayjs): Promise<Receipt[]> {
        const start = date
            .set('date', 0)
            .set('hour', 0)
            // .set('minute', 0)
            // .set('second', 0)
            // .set('millisecond', 0)

        const persisted: PersistedReceipt[] = await this.ctx.receiptDbClient
            .select()
            // TODO, reindex with YYY-MM-DD field on receipts table
            // better performance, might not need to surface on domain for now
            .where('transaction_date', '>', start.toISOString())
            .andWhere('transaction_date', '<', (start.add(1, 'month')).toISOString())
        return persisted.map(toDomain)
    }

    async forDate(date: Dayjs): Promise<Receipt[]> {
        const persisted: PersistedReceipt[] = await this.ctx.receiptDbClient
            .select()
            // TODO, reindex with YYY-MM-DD field on receipts table
            // better performance, might not need to surface on domain for now
            .where('transaction_date', '>', date.toISOString())
            .andWhere('transaction_date', '<', (date.add(1, 'day')).toISOString())
        return persisted.map(toDomain)
    }

    async sumAmountByMerchantForDate(date: Dayjs): Promise<{ merchant: string, amount: number }[]> {
        const start = date.startOf('day')
        const end = date.endOf('day')

        const records: { merchant: string, amount: number }[] = (await this.ctx.receiptDbClient
            .select('merchant')
            .sum('amount')
            .where('transaction_date', '>=', start.toISOString())
            .andWhere('transaction_date', '<=', end.toISOString())
            .groupBy('merchant'))
            .map(({ merchant, sum }) => ({
                merchant,
                amount: parseInt(sum)
            }))

        return records
    }

    async sumAmountByMerchantForMonth(date: Dayjs): Promise<{ merchant: string, amount: number }[]> {
        const start = date.startOf('month').format('YYYY-MM-DD')
        const end = date.endOf('month').format('YYYY-MM-DD')

        const records: { merchant: string, amount: number }[] = (await this.ctx.receiptDbClient
            .select('merchant')
            .sum('amount')
            .where('transaction_date', '>=', start)
            .andWhere('transaction_date', '<', end)
            .groupBy('merchant'))
            .map(({ merchant, sum }) => ({
                merchant,
                amount: parseInt(sum)
            }))

        return records
    }

}


export default ReceiptRepository

