import assert from 'assert'
import BudgetService, { BudgetServiceContext } from './budget-service'
import sinon from 'sinon'
import dayjs from 'dayjs'
import Receipt from '../lib/models/domain/receipt'
import { ReceiptCategory } from '../lib/models/enums'

describe('BudgetService', () => {

    const budgetReportRepositoryMock = {
        insert: sinon.stub(),
        rolloverAmountsByCategory: sinon.stub(),
    }
    
    const smsClientMock = {
        send: sinon.stub(),
    }
    
    const receiptRepositoryMock = {
        forWeekOf: sinon.stub(),
    }
    
    beforeEach(() => {
        budgetReportRepositoryMock.insert.reset()
        budgetReportRepositoryMock.rolloverAmountsByCategory.reset()
        smsClientMock.send.reset()
        receiptRepositoryMock.forWeekOf.reset()
    })

    describe('generateBudgetReports', () => {
        it('should insert budget reports for all categories', async () => {
            const date = dayjs('2022-01-01')
            const receipts: Receipt[] = [
                {
                    id: 1,
                    transactionDate: dayjs('2023-03-23'),
                    merchant: 'Test',
                    amount: 59900,
                    rawReceipt: null,
                    category: ReceiptCategory.GROCERIES,
                    createdAt: dayjs()
                }
            ]
            receiptRepositoryMock.forWeekOf.resolves(receipts)
            budgetReportRepositoryMock.insert.resolves()

            const budgetService = new BudgetService({
                budgetReportRepository: budgetReportRepositoryMock as any,
                smsClient: smsClientMock as any,
                receiptRepository: receiptRepositoryMock as any,
            })

            await budgetService.generateBudgetReports(date)

            assert.equal(receiptRepositoryMock.forWeekOf.callCount, 1)
            assert.equal(budgetReportRepositoryMock.insert.callCount, 1)
        })
    })

    describe('verifyWeeklyBudgets', () => {
        it('should send SMS for exceeded budget', async () => {
            const date = dayjs('2022-01-01')
            const receipts = [
                {
                    id: 1,
                    transactionDate: dayjs('2023-03-23'),
                    merchant: 'Test',
                    amount: 59900,
                    rawReceipt: null,
                    category: ReceiptCategory.GROCERIES,
                    createdAt: dayjs()
                }
            ]
            receiptRepositoryMock.forWeekOf.resolves(receipts)
            budgetReportRepositoryMock.rolloverAmountsByCategory.resolves([])
            smsClientMock.send.resolves()

            const budgetService = new BudgetService({
                budgetReportRepository: budgetReportRepositoryMock as any,
                smsClient: smsClientMock as any,
                receiptRepository: receiptRepositoryMock as any,
            })

            await budgetService.verifyWeeklyBudgets(date)

            assert.equal(receiptRepositoryMock.forWeekOf.callCount, 1)
            assert.equal(budgetReportRepositoryMock.rolloverAmountsByCategory.callCount, 1)
            assert.equal(smsClientMock.send.callCount, 1)
        })
    })
})

