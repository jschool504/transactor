export interface Transaction {
    account_id: string
    transaction_id: string
    amount: number
    name: string
    category: string[]
    category_id: string
    date: string
    authorized_date: string
}

export interface TransactionResponse {
    added: Transaction[]
    has_more: boolean
    next_cursor?: string
}