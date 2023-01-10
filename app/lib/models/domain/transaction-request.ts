export default interface TransactionRequest {
    id?: number
    accountId: string
    nextCursor: string
    open: boolean
}
