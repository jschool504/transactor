import { Dayjs } from 'dayjs'
import { ReceiptCategory } from '../enums'

export default interface BudgetReport {
    id?: number,
    created_at: string,
    category: ReceiptCategory,
    amount_spent: number,
    budget_limit: number,
    rollover_amount: number
}
