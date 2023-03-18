import { Dayjs } from 'dayjs'
import { ReceiptCategory } from '../enums'

export interface NewReceipt {
    transactionDate: Dayjs
    merchant: string
    amount: number
    rawReceipt: string
    category: ReceiptCategory
}

interface ReceiptMetadata {
    id?: number
    createdAt: Dayjs
}

type Receipt = NewReceipt & ReceiptMetadata

export default Receipt
