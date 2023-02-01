import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'Your Google Play Order Receipt from Jan 15, 2023',
    date: 'Sun, 15 Jan 2023 18:50:03 -0800',
    expectedTotal: 1293,
    expectedMerchant: 'Google Play',
    expectedTransactionDate: dayjs('Sun, 15 Jan 2023 21:50:03 -0500'),
    id: currentFileName
})
