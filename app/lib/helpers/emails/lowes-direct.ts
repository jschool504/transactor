import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    subject: 'Your Lowe\'s Purchase Receipt',
    date: 'Sat, 21 Jan 2023 21:41:38 +0000',
    expectedTotal: 8825,
    expectedMerchant: 'Lowe\'s',
    expectedTransactionDate: dayjs('2023-01-21 16:41:38-0500'),
    id: currentFileName
})
