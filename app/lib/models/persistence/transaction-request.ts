export default interface TransactionRequest {
    id?: number
    account_id: string
    next_cursor: string
    open: boolean
    started_at: string
    completed_at: string
}
