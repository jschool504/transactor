export default interface Receipt {
    id?: number
    created_at: string
    transaction_date: string
    merchant: string
    amount: number
    raw_receipt: string
    category: number
}
