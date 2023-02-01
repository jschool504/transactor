import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    date: 'Tue, 24 Jan 2023 16:54:36 +0000',
    subject: 'Your Amazon.com order #112-5195239-8501054 has shipped',
    expectedTotal: 2781,
    expectedMerchant: 'Amazon.com',
    expectedTransactionDate: dayjs('2023-01-24 11:54:36-0500'),
    id: currentFileName
})
