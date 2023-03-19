import { Dayjs } from 'dayjs'
import { ReceiptCategory } from '../enums'

export interface NewBudgetReport {
    category: ReceiptCategory,
    amountSpent: number,
    budgetLimit: number,
    rolloverAmount: number
}

interface BudgetReportMetadata {
    id?: number
    createdAt: Dayjs
}

type BudgetReport = NewBudgetReport & BudgetReportMetadata

export default BudgetReport
