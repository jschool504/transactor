import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    expectedTotal: 5561,
    expectedMerchant: 'DigitalOcean',
    expectedTransactionDate: dayjs('2022-12-31 22:27:18-0500'),
    subject: 'DigitalOcean - Payment Receipt',
    date: 'Sat, 31 Dec 2022 19:27:18 -0800',
    id: currentFileName
})
