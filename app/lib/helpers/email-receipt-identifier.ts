import ReceiptIdentifier from '../interfaces/receipt-identifier'
import { EmailIdentificationCertainty } from '../models/enums'
import Email from '../models/external/email'

Object.prototype.toString = function(replacer?: (this: any, key: string, value: any) => string, space?: string | number) {
    return JSON.stringify(this, replacer, space)
}

const score = ({
    hasReceipt,
    hasOrder,
    hasPayment,
    hasAuthorized,
    hasCurrency
}) => (
    ([
        hasReceipt      && 2,
        hasOrder        && 1,
        hasPayment      && 1,
        hasAuthorized   && 1,
        hasCurrency     && 1
    ])
    .filter(o => !!o)
    .reduce((a, s) => a + s, 0)
)

const toCertainty = (points: number): EmailIdentificationCertainty => {
    if (points > 1) {
        return EmailIdentificationCertainty.CERTAIN
    }

    if (points === 1) {
        return EmailIdentificationCertainty.UNSURE
    }

    return EmailIdentificationCertainty.FAILED
}

export class EmailReceiptIdentifier implements ReceiptIdentifier<Email, EmailIdentificationCertainty> {

    constructor(ctx: {}) {}

    identify(email: Email) {

        const subject = email.subject.toLowerCase()

        const points = score({
            hasReceipt: subject.includes('receipt'),
            hasOrder: subject.includes('order'),
            hasPayment: subject.includes('payment'),
            hasAuthorized: subject .includes('authorized'),
            hasCurrency: subject.match(/\$\d+/g) || false
        })

        return toCertainty(points)
    }

}