import assert from 'assert'
import dayjs, { Dayjs } from 'dayjs'
import fs from 'fs'
import ReceiptParser from './receipt-parser'


const EMAILS = {
    'black-and-brew': {
        subject: 'Online Order Receipt for $6.83 at Black & Brew Southside',
        date: 'Wed, 12 Jan 2023 05:45:00 -0500',
        expectedTotal: 683,
        expectedMerchant: 'Black & Brew Southside',
        expectedTransactionDate: dayjs('2023-01-12 05:45:00')
    },
    'sunpass-receipt': {
        subject: 'SunPass Receipt',
        date: 'Thu, 13 Jan 2023 04:54:00 -0500',
        expectedTotal: 1000,
        expectedMerchant: 'SunPass',
        expectedTransactionDate: dayjs('2023-01-13 04:54:00')
    },
    'relay-fm': {
        subject: 'Your receipt from Relay FM.',
        date: 'Thu, 5 Jan 2023 15:01:48 -0800',
        expectedTotal: 500,
        expectedMerchant: 'Relay FM.',
        expectedTransactionDate: dayjs('2023-01-05 18:01:48-0500')
    },
    'lowes': {
        subject: 'Receipt from LOWES.COM for your $100.58 USD purchase',
        date: 'Mon, 2 Jan 2023 13:26:31 -0800',
        expectedTotal: 10058,
        expectedMerchant: 'LOWES',
        expectedTransactionDate: dayjs('2023-01-02 16:26:31-0500')
    },
    'twitch': {
        subject: 'Receipt for Your Payment to Twitch Interactive, Inc.',
        date: 'Thu, 12 Jan 2023 20:47:17 -0800',
        expectedTotal: 499,
        expectedMerchant: 'Twitch Interactive',
        expectedTransactionDate: dayjs('2023-01-12 23:47:17-0500')
    },
    'digitalocean': {
        subject: 'DigitalOcean - Payment Receipt',
        date: 'Sat, 31 Dec 2022 19:27:18 -0800',
        expectedTotal: 5561,
        expectedMerchant: 'DigitalOcean',
        expectedTransactionDate: dayjs('2022-12-31 22:27:18-0500')
    },
    'homedepot': {
        subject: 'Thanks for your order, Jeremy!',
        date: 'Tue, 10 Jan 2023 11:48:40 -0800',
        expectedTotal: 21293,
        expectedMerchant: 'The Home Depot',
        expectedTransactionDate: dayjs('2023-01-10 14:48:40-0500')
    }
}


describe('ReceiptParser', () => {

    Object.entries(EMAILS).forEach(([id, { subject, date, expectedTotal, expectedMerchant, expectedTransactionDate }]) => {

        describe(`when retrieving the total from ${id.split('-').join(' ').toUpperCase()}`, () => {

            it('should get the total', () => {

                const parser = new ReceiptParser({})
                const actual = parser.getTotal({
                    subject,
                    date,
                    body: fs.readFileSync(`app/lib/helpers/test-data/${id}.html`).toString()
                })
                assert(actual === expectedTotal, `${actual} !== ${expectedTotal}`)

            })

            it('should get the merchant', () => {

                const parser = new ReceiptParser({})
                const actual = parser.getMerchant({
                    subject,
                    date,
                    body: fs.readFileSync(`app/lib/helpers/test-data/${id}.html`).toString()
                })
                assert(actual === expectedMerchant, `${actual} !== ${expectedMerchant}`)

            })

            it('should get the transaction date', () => {

                const parser = new ReceiptParser({})
                const actual = parser.getTransactionDate({
                    subject,
                    date,
                    body: fs.readFileSync(`app/lib/helpers/test-data/${id}.html`).toString()
                })
                assert(actual.isSame(expectedTransactionDate), `${actual} is not same as ${expectedTransactionDate}`)

            })

        })

    })

})
