import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'Receipt from LOWES.COM for your $100.58 USD purchase',
    date: 'Mon, 2 Jan 2023 13:26:31 -0800',
    expectedTotal: 10058,
    expectedMerchant: 'LOWES',
    expectedTransactionDate: dayjs('2023-01-02 16:26:31-0500'),
    id: currentFileName
})
