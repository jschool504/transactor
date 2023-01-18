import assert from 'assert'
import { EmailReceiptIdentifier } from './email-receipt-identifier'
import { EmailIdentificationCertainty } from '../models/enums'


const SUBJECTS = {

    // receipt only
    'SunPass Receipt': EmailIdentificationCertainty.CERTAIN,
    'Online Order Receipt for $6.83 at Black & Brew Southside': EmailIdentificationCertainty.CERTAIN,
    'Your receipt from Relay FM.': EmailIdentificationCertainty.CERTAIN,
    'Receipt from LOWES.COM for your $100.58 USD purchase': EmailIdentificationCertainty.CERTAIN,

    // receipt and payment
    'Receipt for Your Payment to Twitch Interactive, Inc.': EmailIdentificationCertainty.CERTAIN,
    'DigitalOcean - Payment Receipt': EmailIdentificationCertainty.CERTAIN,

    // order only
    'Order ICECO26158 confirmed': EmailIdentificationCertainty.UNSURE,
    
    // order + $number
    'You submitted an order in the amount of $212.93 USD to The Home Depot': EmailIdentificationCertainty.CERTAIN,

    // payment + authorized
    'You have authorized a payment to GrubHub Seamless': EmailIdentificationCertainty.CERTAIN

}


describe('EmailReceptionService', () => {

    describe('EmailReceiptIdentifier', () => {

        describe('when asked to process transactions requests', () => {
    
            Object.entries(SUBJECTS).forEach(([subject, expected]) => {
    
                describe(`when email subject is "${subject}"`, () => {
        
                    it('should identify the email as a receipt', async () => {
            
                        const identifier = new EmailReceiptIdentifier({})
                        const actual = identifier.identify({ subject, date: '', body: '' })
                        assert(
                            actual === expected,
                            `expected ${EmailIdentificationCertainty[expected]}, got ${EmailIdentificationCertainty[actual]}`
                        )
            
                    })
        
                })
    
            })

        })

    })


})
