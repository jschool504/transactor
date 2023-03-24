import assert from 'assert'
import sinon from 'sinon'
import EmailReceptionService from './email-reception-service'
import { EmailReceiptIdentifier } from '../lib/helpers/email-receipt-identifier'
import ReceiptParser from '../lib/interfaces/receipt-parser'
import ReceiptEmailParser from '../lib/helpers/receipt-parser'
import Email from '../lib/models/external/email'
import MerchantRepository from '../lib/repositories/merchant-repository'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import EventService from './event-service'
import MerchantCategoryHelper from '../lib/helpers/merchant-category-helper'
import { EmailIdentificationCertainty } from '../lib/models/enums'
import dayjs from 'dayjs'

const dummyEmail = {
  from: {
    name: 'John Doe',
    address: 'johndoe@example.com'
  },
  to: {
    name: 'Jane Smith',
    address: 'janesmith@example.com'
  },
  subject: 'Receipt for your purchase',
  body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
  date: '2022-04-01T12:00:00Z'
}

const event = {
  topic: 'RECEIPT_EMAIL_RECEIVED',
  message: JSON.stringify(dummyEmail),
  processed: false,
  createdAt: dayjs(),
  updatedAt: dayjs(),
  id: 123
}


describe('EmailReceptionService', () => {
  let emailReceptionService: EmailReceptionService
  let emailReceiptIdentifierMock: sinon.SinonStubbedInstance<EmailReceiptIdentifier>
  let receiptEmailParserMock: sinon.SinonStubbedInstance<ReceiptParser<Email>>
  let eventServiceMock: sinon.SinonStubbedInstance<EventService>
  let receiptRepositoryMock: sinon.SinonStubbedInstance<ReceiptRepository>
  let merchantRepositoryMock: sinon.SinonStubbedInstance<MerchantRepository>
  let merchantCategoryHelperMock: sinon.SinonStubbedInstance<MerchantCategoryHelper>

  beforeEach(() => {
    emailReceiptIdentifierMock = sinon.createStubInstance(EmailReceiptIdentifier)
    receiptEmailParserMock = sinon.createStubInstance(ReceiptEmailParser)
    eventServiceMock = sinon.createStubInstance(EventService)
    receiptRepositoryMock = sinon.createStubInstance(ReceiptRepository)
    merchantRepositoryMock = sinon.createStubInstance(MerchantRepository)
    merchantCategoryHelperMock = sinon.createStubInstance(MerchantCategoryHelper)

    emailReceptionService = new EmailReceptionService({
      emailReceiptIdentifier: emailReceiptIdentifierMock as any,
      receiptEmailParser: receiptEmailParserMock as any,
      eventService: eventServiceMock as any,
      receiptRepository: receiptRepositoryMock as any,
      merchantRepository: merchantRepositoryMock as any,
      merchantCategoryHelper: merchantCategoryHelperMock as any
    })
  })

  describe('handleEmailReceived', () => {

    it('should publish RECEIPT_EMAIL_RECEIVED event if email is identified as receipt', async () => {
      const email = {} as Email
      emailReceiptIdentifierMock.identify.returns(EmailIdentificationCertainty.CERTAIN)

      await emailReceptionService.handleEmailReceived(email)

      assert.strictEqual(eventServiceMock.publish.callCount, 1);
      assert.deepStrictEqual(eventServiceMock.publish.firstCall.args[0], {
        topic: 'RECEIPT_EMAIL_RECEIVED',
        message: JSON.stringify(email)
      });

    })

    it('should not publish RECEIPT_EMAIL_RECEIVED event if email is not identified as receipt', async () => {
      const email = {} as Email
      emailReceiptIdentifierMock.identify.returns(EmailIdentificationCertainty.FAILED)

      await emailReceptionService.handleEmailReceived(email)

      assert(!eventServiceMock.publish.called)
    })

    it('should not publish RECEIPT_EMAIL_RECEIVED event if email identification is uncertain', async () => {
      const email = {} as Email
      emailReceiptIdentifierMock.identify.returns(EmailIdentificationCertainty.UNSURE)
  
      await emailReceptionService.handleEmailReceived(email)
  
      assert(eventServiceMock.publish.notCalled)
    })

  })

  describe('processReceiptEmailReceived', () => {
      it('should return an object with processed false and an error message when getTotal returns falsy', async () => {
          receiptEmailParserMock.getTotal.returns(null)

          const result = await emailReceptionService.processReceiptEmailReceived(event)

          assert.deepStrictEqual(result, {
              processed: false,
              error: 'Expected amount to not be null',
          })
      })

      /**
       * This test creates an email object and an event object, mocks the getTotal method
       * to return null, and expects the processReceiptEmailReceived method to return an
       * object with processed set to false and an error message containing the expected
       * error string.
       */
      it('should return an error if no amount is found', async () => {
        const expectedError = 'Expected amount to not be null'
        receiptEmailParserMock.getTotal.returns(null)
      
        const result = await emailReceptionService.processReceiptEmailReceived(event)
      
        assert.deepStrictEqual(result, {
          processed: false,
          error: expectedError
        })
      })

      it('should return an error if transaction date is missing', async () => {
        // Make parser return values
        receiptEmailParserMock.getTotal.returns(100.00)
        receiptEmailParserMock.getMerchant.returns('Test Merchant')
        receiptEmailParserMock.getTransactionDate.returns(null)
      
        const result = await emailReceptionService.processReceiptEmailReceived(event)
      
        assert.deepEqual(result, {
          processed: false,
          error: 'Expected transactionDate to not be null'
        })
        assert.strictEqual(receiptRepositoryMock.insert.called, false)
      })
      
      it('should not insert receipt into repository when merchant field is missing', async () => {
        receiptEmailParserMock.getMerchant.returns(null)
        
        const event = {
          topic: 'RECEIPT_EMAIL_RECEIVED',
          message: JSON.stringify(dummyEmail)
        }
        
        assert(eventServiceMock.publish.calledOnce)
        assert.deepEqual(eventServiceMock.publish.firstCall.args[0], {
          topic: 'RECEIPT_EMAIL_RECEIVED',
          message: JSON.stringify(dummyEmail)
        })

        const result = await emailReceptionService.processReceiptEmailReceived(event)
        assert(!result.processed)
        assert.equal(result.error, 'Expected merchant to not be undefined')
        assert(receiptRepositoryMock.insert.notCalled)
      })
      
      

  })


})
