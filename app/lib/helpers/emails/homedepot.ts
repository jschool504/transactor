import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    expectedTotal: 21293,
    expectedMerchant: 'The Home Depot',
    expectedTransactionDate: dayjs('2023-01-10 14:48:40-0500'),
    subject: 'Thanks for your order, Jeremy!',
    date: 'Tue, 10 Jan 2023 11:48:40 -0800',
    id: currentFileName
})
