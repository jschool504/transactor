import fs from 'fs'
import { Dayjs } from 'dayjs'

interface EmailTestCaseData {

    // expected
    expectedTotal: number
    expectedMerchant: string
    expectedTransactionDate: Dayjs

    // setup data
    subject: string
    date: string
    id: string

}

interface EmailTestCase extends EmailTestCaseData {
    body: string
}


export default function EmailTestCase(testCase: EmailTestCaseData): EmailTestCase {
    return {
        ...testCase,
        body: fs.readFileSync(`app/lib/helpers/html/${testCase.id}.html`).toString()
    }
}
