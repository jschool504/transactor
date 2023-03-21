import assert from 'assert'
import { ReceiptCategory } from '../models/enums'
import MerchantCategoryHelper from './merchant-category-helper'

describe('MerchantCategoryHelper', () => {

    describe('categorize', () => {

        it('should return a mapping', () => {
            const helper = new MerchantCategoryHelper({})
            const actual = helper.categorize('Target')
            assert(
                ReceiptCategory.GROCERIES === actual,
                `expected 'GROCERIES', got '${ReceiptCategory[actual]}'`
            )
        })

        it('should uncategorized', () => {
            const helper = new MerchantCategoryHelper({})
            const actual = helper.categorize('Random thingy')
            assert(
                ReceiptCategory.UNCATEGORIZED === actual,
                `expected 'UNCATEGORIZED', got '${ReceiptCategory[actual]}'`
            )
        })

    })

})