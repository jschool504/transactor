import dayjs from 'dayjs'
import { basename } from 'path'
import EmailTestCase from '../base'

const [currentFileName] = basename(__filename).split('.')

export default EmailTestCase({
    date: 'Sat, 16 Apr 2011 22:33:39 +0000 (GMT)',
    subject: 'Your receipt #144017881678',
    expectedTotal: 895,
    expectedMerchant: 'Apple',
    expectedTransactionDate: dayjs('2011-04-16 17:33:39-0500'),
    id: currentFileName
})
