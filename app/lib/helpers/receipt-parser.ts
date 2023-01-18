import dayjs, { Dayjs } from 'dayjs'
import Email from '../models/external/email'
import { measure } from '../utils'

// @ts-ignore
Array.prototype.first = function(): T | null {
    if (this.length) {
        return this[0]
    }

    return null
}

const TotalRetrievers = {
    fromTotal: (email: Email) => {
        const locationOfTotalString = email.body.indexOf('Total')
        const textAroundTotal = email.body.slice(locationOfTotalString, locationOfTotalString + 200)
        const match = textAroundTotal.match(/(?<=\$)\d+\.\d+/)
        if (match) {
            const totalDollars = parseFloat(match[0])
            return totalDollars * 100
        }
    },
    fromAmount: (email: Email) => {
        const locationOfTotalString = email.body.indexOf('Amount')
        const textAroundTotal = email.body.slice(locationOfTotalString, locationOfTotalString + 200)
        const match = textAroundTotal.match(/(?<=\$)\d+\.\d+/)
        if (match) {
            const totalDollars = parseFloat(match[0])
            return totalDollars * 100
        }
    },
    fromLargestAmount: (email: Email) => {
        const amounts = email.body
            .match(/(?<=\$)\d+\.\d+/g)
            .map(n => parseFloat(n))

        amounts.sort((a, b) => ({
            true: 1,
            false: -2
        })[(a < b).toString()])

        // @ts-ignore
        const amount = amounts.first()

        return amount && amount * 100
    }
}

const Merchant = {
    From: {
        Subject: {
            After: {
                At: (email: Email) => {
                    const m = email.subject
                        .match(/(?<=at\s)(([a-zA-Z]|\&)+(\s|$))+/)
            
                    if (m) return m[0]
            
                    return null
                },
                From: {
                    At: {
                        End: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=from\s)([a-zA-Z]|\s|\.)+$/)
        
                            if (m) return m[0]
        
                            return null
                        }
                    }
                }
            },
            Before: {
                PaymentReceipt: (email: Email) => {
                    const m = email.subject
                        .match(/[a-zA-Z]+(?=.+Payment\sReceipt)/)

                    if (m) return m[0]
            
                    return null
                },
                Receipt: (email: Email) => {
                    const m = email.subject
                        .match(/[a-zA-Z]+(?=\sReceipt$)/)

                    if (m) return m[0]
            
                    return null
                }
            },
            Between: {
                ReceiptFrom: {
                    And: {
                        COM: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=(R|r)eceipt\sfrom\s)([a-zA-Z]+|(?=\.(com|COM)))/)

                            if (m) return m[0]
        
                            return null
                        }
                    }
                },
                To: {
                    And: {
                        Inc: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=to\s)(([a-zA-Z](\s)?)+|(?=\,(Inc|inc)))/)

                            if (m) return m[0]
        
                            return null
                        }
                    }
                }
            }
        },
        Body: {
            In: {
                Title: (email: Email) => {
                    const m = email.body
                        .match(/(?<=\<(title)\>)([a-zA-Z]+\s?)+(?=\<\/(title)\>)/)

                    if (m) return m[0]
        
                    return null
                }
            }
        }
    }
}


const TransactionDate = {
    From: {
        Body: {
            Format: {
                Month: {
                    Day: {
                        ShortYear: {
                            Hour: {
                                Minute: {
                                    Meridian: (email: Email) => {
                                        const m = email.body.match(/(\d\d?)\/(\d\d?)\/(\d{2})(\s|T)(\d\d?)\:(\d\d?)\s((am|AM)|(pm|PM))/)

                                        if (m) return dayjs(m[0])
                                        return null
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}


export default class ReceiptParser {

    constructor(ctx: {}) {}

    @measure
    getTotal(email: Email): number | null {

        const total = TotalRetrievers.fromTotal(email)
        if (total) {
            return total
        }

        const amount = TotalRetrievers.fromAmount(email)
        if (amount) {
            return amount
        }

        const largest = TotalRetrievers.fromLargestAmount(email)
        if (largest) {
            return largest
        }

        return null
    }

    @measure
    getMerchant(email: Email): string | null {
        return (
            Merchant.From.Subject.After.At(email)
            || Merchant.From.Subject.After.From.At.End(email)
            || Merchant.From.Subject.Before.PaymentReceipt(email)
            || Merchant.From.Subject.Before.Receipt(email)
            || Merchant.From.Subject.Between.ReceiptFrom.And.COM(email)
            || Merchant.From.Subject.Between.To.And.Inc(email)
            || Merchant.From.Body.In.Title(email)
            || null
        )
    }

    @measure
    getTransactionDate(email: Email): Dayjs {
        return dayjs(email.date)
    }

}
