import { EmailReceiptIdentifier } from '../lib/helpers/email-receipt-identifier'
import MerchantCategoryHelper from '../lib/helpers/merchant-category-helper'
import createMerchantNameNormalizer from '../lib/helpers/normalize-merchant'
import ReceiptParser from '../lib/interfaces/receipt-parser'
import Event from '../lib/models/domain/event'
import { EmailIdentificationCertainty } from '../lib/models/enums'
import Email from '../lib/models/external/email'
import MerchantRepository from '../lib/repositories/merchant-repository'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import { measure } from '../lib/utils'
import EventService from './event-service'

interface EmailReceptionServiceContext {
    emailReceiptIdentifier: EmailReceiptIdentifier
    receiptEmailParser: ReceiptParser<Email>
    receiptRepository: ReceiptRepository
    eventService: EventService
    merchantRepository: MerchantRepository
    merchantCategoryHelper: MerchantCategoryHelper
}

class EmailReceptionService {

    constructor(
        private ctx: EmailReceptionServiceContext
    ) {}

    // called by zapier when receiving a new email
    @measure
    async handleEmailReceived(email: Email) {
        const isReceipt = this.ctx.emailReceiptIdentifier.identify(email) === EmailIdentificationCertainty.CERTAIN
        if (isReceipt) {
            this.ctx.eventService.publish({
                topic: 'RECEIPT_EMAIL_RECEIVED',
                message: JSON.stringify(email)
            })
        }
    }

    // called by event service when RECEIPT_EMAIL_RECEIVED event published
    @measure
    async processReceiptEmailReceived(event: Event) {
        try {
            const email: Email = JSON.parse(event.message) as Email
            const amount = this.ctx.receiptEmailParser.getTotal(email)
            const merchant = this.ctx.receiptEmailParser.getMerchant(email)
            const transactionDate = this.ctx.receiptEmailParser.getTransactionDate(email)

            if (!amount) {
                return {
                    processed: false,
                    error: 'Expected amount to not be ' + amount
                }
            }

            if (!merchant) {
                return {
                    processed: false,
                    error: 'Expected merchant to not be ' + merchant
                }
            }

            if (!transactionDate) {
                return {
                    processed: false,
                    error: 'Expected transactionDate to not be ' + transactionDate
                }
            }

            const normalized = createMerchantNameNormalizer(await this.ctx.merchantRepository.names())(merchant)
            const category = this.ctx.merchantCategoryHelper.categorize(normalized)

            await this.ctx.receiptRepository.insert({
                merchant: normalized,
                transactionDate,
                amount: Math.round(amount),
                rawReceipt: JSON.stringify(email),
                category: category
            })
            return {
                processed: true,
                error: null
            }
        } catch (e) {
            return {
                processed: false,
                error: e.stack.toString()
            }
        }
    }

}

export default EmailReceptionService
