import { Dayjs } from 'dayjs'

export interface NewReceipt {
    transactionDate: Dayjs
    merchant: string
    amount: number
    rawReceipt: string
}

interface ReceiptMetadata {
    id?: number
    createdAt: Dayjs
}

type Receipt = NewReceipt & ReceiptMetadata

export default Receipt
