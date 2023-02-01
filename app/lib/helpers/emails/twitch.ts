import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'Receipt for Your Payment to Twitch Interactive, Inc.',
    date: 'Thu, 12 Jan 2023 20:47:17 -0800',
    expectedTotal: 499,
    expectedMerchant: 'Twitch Interactive',
    expectedTransactionDate: dayjs('2023-01-12 23:47:17-0500'),
    id: currentFileName
})
