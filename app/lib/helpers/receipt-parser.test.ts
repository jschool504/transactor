import assert from 'assert'
import dayjs, { Dayjs } from 'dayjs'
import fs from 'fs'
import ReceiptParser from './receipt-parser'


describe('ReceiptParser', async () => {

    const testCases = fs.readdirSync(__dirname + '/emails')

    await Promise.all(testCases.map(async file => {
        // @ts-ignore
        const { default: testCase } = await import('./emails/' + file)

        const parser = new ReceiptParser({})

        describe(`when retrieving the total from "${testCase.id.split('-').join(' ').toUpperCase()}"`, () => {

            it('should get the total', () => {
                const actual = parser.getTotal(testCase)
                assert(actual === testCase.expectedTotal, `${actual} !== ${testCase.expectedTotal}`)
            })
    
            it('should get the merchant', () => {
                const actual = parser.getMerchant(testCase)
                assert(actual === testCase.expectedMerchant, `${actual} !== ${testCase.expectedMerchant}`)
            })
    
            it('should get the transaction date', () => {
                const actual = parser.getTransactionDate(testCase)
                assert(actual.isSame(testCase.expectedTransactionDate), `${actual} is not the same as ${testCase.expectedTransactionDate}`)
            })

        })

    }))

})
