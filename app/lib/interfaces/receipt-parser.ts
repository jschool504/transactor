import { Dayjs } from 'dayjs'

export default interface ReceiptParser<T> {
    getTotal(receipt: T): number | null
    getMerchant(receipt: T): string | null
    getTransactionDate(receipt: T): Dayjs
}
