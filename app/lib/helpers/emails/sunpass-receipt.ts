import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'SunPass Receipt',
    date: 'Thu, 13 Jan 2023 04:54:00 -0500',
    expectedTotal: 1000,
    expectedMerchant: 'SunPass',
    expectedTransactionDate: dayjs('2023-01-13 04:54:00'),
    id: currentFileName
})
