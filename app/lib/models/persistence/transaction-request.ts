export default interface TransactionRequest {
    id?: number
    account_id: string
    next_cursor: string
    open: boolean
}
