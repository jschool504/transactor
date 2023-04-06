import dayjs from 'dayjs'
import fs from 'fs'
import parse from '../lib/helpers/csv-parser'
import MerchantCategoryHelper from '../lib/helpers/merchant-category-helper'
import { NewReceipt } from '../lib/models/domain/receipt'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import createMerchantNameNormalizer from '../lib/helpers/normalize-merchant'
import MerchantRepository from '../lib/repositories/merchant-repository'

interface StatementServiceContext {
    merchantRepository: MerchantRepository
    merchantCategoryHelper: MerchantCategoryHelper
    receiptRepository: ReceiptRepository
}

interface NavyFederalStatementRow {
    'Transaction Date': string
    'Posted Date': string
    Description: string
    Debit: string
    Credit: string
}

class StatementService {
    constructor(
        private ctx: StatementServiceContext
    ) {}

    // currently NFCU credit card statements only
    async handleStatement(path: string) {
        const rawStatementRows = fs.readFileSync(path)
            .toString()
            .trim()
            .split('\n')
            .map(s => s
                .replaceAll(/(\'|\")/g, '')
                .split('\,')
            )

        const rawHeaders = rawStatementRows[0]
        const rawRows = rawStatementRows.slice(1, rawStatementRows.length - 1)

        const statementRows = parse<NavyFederalStatementRow>(rawHeaders, rawRows)
        const normalizeMerchantName = createMerchantNameNormalizer(await this.ctx.merchantRepository.names())
        const receipts: NewReceipt[] = statementRows.map(row => ({
            transactionDate: dayjs(row['Transaction Date']),
            merchant: normalizeMerchantName(row.Description),
            amount: row.Debit ? parseInt(row.Debit.replace(/\./, '')) : 0,
            rawReceipt: JSON.stringify(row),
            category: this.ctx.merchantCategoryHelper.categorize(row.Description)
        }))

        const existingReceipts = await this.ctx.receiptRepository.between(
            receipts[0].transactionDate,
            receipts[receipts.length - 1].transactionDate
        )

        const findMatching = (r: NewReceipt) => !!existingReceipts.find(er => (
            r.merchant === er.merchant
            && r.transactionDate.format('YYYY-MM-DD') === er.transactionDate.format('YYYY-MM-DD')
            && r.amount === er.amount
        ))

        const newReceipts = receipts
            .filter(r => !findMatching(r))

        console.log(newReceipts)

        // this.ctx.receiptRepository.

        // console.log(receipts)

        // return 

    }
}

export default StatementService
