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
        groupBy: () => Promise.resolve([
          { merchant: 'PetSmart' },
          { merchant: 'Steam Games' },
          { merchant: 'The Home Depot' },
          { merchant: 'Henson Shaving' },
          { merchant: 'Zapier' },
        ])
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
          "transactionDate": dayjs("2023-03-20T04:00:00.000Z"),
          "merchant": "PetSmart",
          "amount": 9126,
          "rawReceipt": "{\"Transaction Date\":\"3/20/2023\",\"Posted Date\":\"3/22/2023\",\"Description\":\"PETSMART  2236 0000 LAKELAND 069\",\"Debit\":\"91.26\",\"Credit\":\"\"}",
          "category": 1000
      },
      {
          "transactionDate": dayjs("2023-03-20T04:00:00.000Z"),
          "merchant": "Henson Shaving",
          "amount": 8554,
          "rawReceipt": "{\"Transaction Date\":\"3/20/2023\",\"Posted Date\":\"3/21/2023\",\"Description\":\"PAYPAL HENSONSHAVI 5195026967 000\",\"Debit\":\"85.54\",\"Credit\":\"\"}",
          "category": 1000
      },
      {
          "transactionDate": dayjs("2023-03-18T04:00:00.000Z"),
          "merchant": "Steam Games",
          "amount": 1526,
          "rawReceipt": "{\"Transaction Date\":\"3/18/2023\",\"Posted Date\":\"3/21/2023\",\"Description\":\"PAYPAL STEAM GAMES 4259522985 107\",\"Debit\":\"15.26\",\"Credit\":\"\"}",
          "category": 1000
      },
      {
          "transactionDate": dayjs("2023-03-17T04:00:00.000Z"),
          "merchant": "The Home Depot",
          "amount": 15639,
          "rawReceipt": "{\"Transaction Date\":\"3/17/2023\",\"Posted Date\":\"3/20/2023\",\"Description\":\"THE HOME DEPOT 0248 LAKELAND 069\",\"Debit\":\"156.39\",\"Credit\":\"\"}",
          "category": 1000
      }
    ]

    const result = await statementService.handleStatement('test.csv')

    assert.deepStrictEqual(result, expected)
  })
})
