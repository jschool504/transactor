import dayjs, { Dayjs } from 'dayjs'
import ReceiptParser from '../interfaces/receipt-parser'
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
    fromTotal: {
        With: {
            Prefix: {
                $: (email: Email) => {
                    const totalMatch = email.body.match(/(?<!((S|s)ub))((T|t)otal)(?!(\s?(T|t)ax))/)
                    if (!totalMatch) return null
                    const locationOfTotalString = totalMatch.index
                    const textAroundTotal = email.body.slice(locationOfTotalString, locationOfTotalString + 200)
                    const match = textAroundTotal.match(/(?<=\$\s?)\d+\.\d+/)
                    if (match) {
                        const totalDollars = parseFloat(match[0])
                        return Math.round(totalDollars * 100)
                    }
                },
                USD: (email: Email) => {
                    const locationOfTotalString = email.body.indexOf('Total')
                    const textAroundTotal = email.body.slice(locationOfTotalString, locationOfTotalString + 200)
                    const match = textAroundTotal.match(/(?<=USD\s?)\d+\.\d+/)
                    if (match) {
                        const totalDollars = parseFloat(match[0])
                        return Math.round(totalDollars * 100)
                    }
                }
            }
        },
    },
    fromAmount: (email: Email) => {
        const locationOfTotalString = email.body.indexOf('Amount')
        const textAroundTotal = email.body.slice(locationOfTotalString, locationOfTotalString + 200)
        const match = textAroundTotal.match(/(?<=\$)\d+\.\d+/)
        if (match) {
            const totalDollars = parseFloat(match[0])
            return Math.round(totalDollars * 100)
        }
    },
    fromLargestAmount: (email: Email) => {
        const amounts = (email.body
            .match(/(?<=\$)\d+\.\d+/g) || [])
            .map(n => parseFloat(n))

        amounts.sort((a, b) => ({
            true: 1,
            false: -2
        })[(a < b).toString()])

        // @ts-ignore
        const amount = amounts.first()

        return Math.round(amount && amount * 100)
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
                Your: {
                    And: {
                        PurchaseReceipt: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=((Y|y)our\s))([a-zA-Z\'])+(?=.+Purchase\sReceipt)/)
        
                            if (m) return m[0]
                    
                            return null
                        },
                        OrderReceipt: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=((Y|y)our\s))([a-zA-Z\'\s])+(?=.+Order\sReceipt)/)
        
                            if (m) return m[0]
                    
                            return null
                        },
                        Order: (email: Email) => {
                            const m = email.subject
                                .match(/(?<=((Y|y)our\s))([a-zA-Z\'\.\s])+(?=.+(O|o)rder)/)
        
                            if (m) return m[0]
                    
                            return null
                        }
                    }
                },
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
                },
                First: {
                    Line: {
                        Before: {
                            Receipt: (email: Email) => {
                                const m = email.body.split('\n')[0]
                                    .match(/[a-zA-Z]+(?=(\s?(R|r)eceipt))/)

                                if (m) return m[0]
                    
                                return null
                            }
                        }
                    }
                }
            }
        }
    }
}


export default class ReceiptEmailParser implements ReceiptParser<Email> {

    constructor(ctx: {}) {}

    getTotal(email: Email): number | null {
        return (
            TotalRetrievers.fromTotal.With.Prefix.$(email)
            || TotalRetrievers.fromTotal.With.Prefix.USD(email)
            || TotalRetrievers.fromAmount(email)
            || TotalRetrievers.fromLargestAmount(email)
            || null
        )
    }

    getMerchant(email: Email): string | null {
        return (
            Merchant.From.Subject.After.At(email)
            || Merchant.From.Subject.After.From.At.End(email)
            || Merchant.From.Subject.Before.PaymentReceipt(email)
            || Merchant.From.Subject.Between.Your.And.OrderReceipt(email)
            || Merchant.From.Subject.Between.Your.And.PurchaseReceipt(email)
            || Merchant.From.Subject.Before.Receipt(email)
            || Merchant.From.Subject.Between.ReceiptFrom.And.COM(email)
            || Merchant.From.Subject.Between.To.And.Inc(email)
            || Merchant.From.Subject.Between.Your.And.Order(email)
            || Merchant.From.Body.In.Title(email)
            || Merchant.From.Body.In.First.Line.Before.Receipt(email)
            || null
        )
    }

    getTransactionDate(email: Email): Dayjs {
        return dayjs(email.date)
    }

}
