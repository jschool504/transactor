export default interface Transaction {
    id?: number
    account_id: string
    transaction_id: string
    amount: number
    name: string
    date: string
    merchant_name?: string
    category_id?: string
    transaction_request_id?: number
}
