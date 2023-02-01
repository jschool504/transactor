import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    expectedTotal: 683,
    expectedMerchant: 'Black & Brew Southside',
    expectedTransactionDate: dayjs('2023-01-12 05:45:00'),
    subject: 'Online Order Receipt for $6.83 at Black & Brew Southside',
    date: 'Wed, 12 Jan 2023 05:45:00 -0500',
    id: currentFileName
})
