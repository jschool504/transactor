import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'Your receipt from Relay FM.',
    date: 'Thu, 5 Jan 2023 15:01:48 -0800',
    expectedTotal: 500,
    expectedMerchant: 'Relay FM.',
    expectedTransactionDate: dayjs('2023-01-05 18:01:48-0500'),
    id: currentFileName
})
