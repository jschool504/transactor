import { EmailReceiptIdentifier } from '../lib/helpers/email-receipt-identifier'
import ReceiptParser from '../lib/helpers/receipt-parser'
import Event from '../lib/models/domain/event'
import Email from '../lib/models/external/email'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import { measure } from '../lib/utils'
import EventService from './event-service'

interface EmailReceptionServiceContext {
    emailReceiptIdentifier: EmailReceiptIdentifier
    receiptParser: ReceiptParser
    receiptRepository: ReceiptRepository
    eventService: EventService
}

class EmailReceptionService {

    constructor(
        private ctx: EmailReceptionServiceContext
    ) {}

    // called by zapier when receiving a new email
    @measure
    async handleEmailReceived(email: Email) {
        const isReceipt = this.ctx.emailReceiptIdentifier.identify(email)
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
            const amount = this.ctx.receiptParser.getTotal(email)
            const merchant = this.ctx.receiptParser.getMerchant(email)
            const transactionDate = this.ctx.receiptParser.getTransactionDate(email)
            if (amount) {
                await this.ctx.receiptRepository.insert({
                    merchant,
                    transactionDate,
                    amount,
                    rawReceipt: JSON.stringify(email)
                })
                return true
            }
        } catch (e) {
            return false
        }
    }

}

export default EmailReceptionService
