import { Dayjs } from "dayjs"

export default interface Transaction {
    id?: number
    accountId: string
    transactionId: string
    amount: number
    name: string
    date: Dayjs
    merchantName?: string
    categoryId?: string
}
