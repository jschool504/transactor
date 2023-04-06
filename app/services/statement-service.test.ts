import assert from 'assert'
import StatementService from './statement-service'
import fs from 'fs'
import sinon from 'sinon'
import { NewReceipt } from '../lib/models/domain/receipt'
import { ReceiptCategory } from '../lib/models/enums'
import dayjs from 'dayjs'
import MerchantCategoryHelper from '../lib/helpers/merchant-category-helper'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import PersistedReceipt from '../lib/models/persistence/receipt'
import { Knex } from 'knex'
import MerchantRepository from '../lib/repositories/merchant-repository'

describe('StatementService', () => {
  let statementService: StatementService

  beforeEach(() => {
    const receiptDbClient = {
      select: () => ({
        where: () => ({
          andWhere: () => Promise.resolve([])
        }),
        groupBy: () => Promise.resolve([])
      })
    }
    statementService = new StatementService({
      merchantRepository: new MerchantRepository({
        receiptDbClient: receiptDbClient as unknown as Knex.QueryBuilder<PersistedReceipt, any>
      }),
      merchantCategoryHelper: new MerchantCategoryHelper({}),
      receiptRepository: new ReceiptRepository({
        receiptDbClient: receiptDbClient as unknown as Knex.QueryBuilder<PersistedReceipt, any>
      })
    })
  })

  it('should parse CSV file', async () => {
    const csvData = `Transaction Date,Posted Date,Description,Debit,Credit
"3/20/2023","3/22/2023","PETSMART  2236 0000 LAKELAND 069","91.26",""
"3/20/2023","3/21/2023","PAYPAL HENSONSHAVI 5195026967 000","85.54",""
"3/18/2023","3/21/2023","PAYPAL STEAM GAMES 4259522985 107","15.26",""
"3/17/2023","3/20/2023","THE HOME DEPOT 0248 LAKELAND 069","156.39",""
"3/18/2023","3/20/2023","PAYPAL ZAPIER INC 9162025161 065","58.50",""`

    const readFileSyncMock = sinon.stub().returns(csvData)
    fs.readFileSync = readFileSyncMock

    const expected: NewReceipt[] = [
      {
        merchant: 'PETSMART  2236 0000 LAKELAND 069',
        transactionDate: dayjs('3/22/2023'),
        amount: 91.26,
        rawReceipt: '',
        category: ReceiptCategory.PET
      },
      {
        merchant: 'PAYPAL HENSONSHAVI 5195026967 000',
        transactionDate: dayjs('3/21/2023'),
        amount: 85.54,
        rawReceipt: '',
        category: ReceiptCategory.SHOPPING
      },
      {
        merchant: 'PAYPAL STEAM GAMES 4259522985 107',
        transactionDate: dayjs('3/21/2023'),
        amount: 15.26,
        rawReceipt: '',
        category: ReceiptCategory.GAMING
      },
      {
        merchant: 'THE HOME DEPOT 0248 LAKELAND 069',
        transactionDate: dayjs('3/20/2023'),
        amount: 156.39,
        rawReceipt: '',
        category: ReceiptCategory.PROJECTS
      },
      {
        merchant: 'PAYPAL ZAPIER INC 9162025161 065',
        transactionDate: dayjs('3/20/2023'),
        amount: 58.50,
        rawReceipt: '',
        category: ReceiptCategory.PROJECTS
      }
    ]

    const result = await statementService.handleStatement('test.csv')

    assert.deepStrictEqual(result, expected)
  })
})
