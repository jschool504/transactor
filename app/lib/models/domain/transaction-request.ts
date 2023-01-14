import { Dayjs } from "dayjs"


export interface NewTransactionRequest {
    accountId: string
    nextCursor: string
    open: boolean
}

export default interface TransactionRequest extends NewTransactionRequest {
    id?: number
    startedAt: Dayjs
    completedAt?: Dayjs
}
