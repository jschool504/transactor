import dayjs, { Dayjs } from 'dayjs';
import ReceiptParser from '../interfaces/receipt-parser'

interface ReceiptImageParserContext {

}

const regex = (fn) => {
    return (input) => {
        const match = fn(input)
        if (match && match.length) {
            return match[0]
        }
    
        return null
    }
}

const toDayjs = (fn) => {
    return (input) => {
        const dateString = fn(input)
        if (dateString) {
            return dayjs(dateString)
        }
    
        return null
    }
}

const toFloat = (fn) => {
    return (input) => {
        const string = fn(input)
        if (string) {
            return parseFloat(string)
        }
    
        return null
    }
}

const toCents = (fn) => {
    return (input) => {
        const dollars = fn(input)
        if (dollars) {
            return Math.round(dollars * 100)
        }
    
        return null
    }
}

const Amount = {
    Where: {
        Prefix: {
            $: toCents(toFloat(regex((receipt: string) => {
                return receipt.match(/\$\d+\.\d{2}/g)
            }))),
            None: toCents((receipt: string) => {
                const matches = (receipt.match(/\d+\.\d{2}/g) || [])
                    .map(str => parseFloat(str))

                matches.sort((a, b) => ({
                    'true': -1,
                    'false': 1 
                }[(a > b).toString()]))

                return matches.length ? matches[0] : null
            })
        }
    }
}

const Date = {
    Where: {
        Format: {
            mmddyyyy: {
                And: {
                    Delimiter: {
                        Slash: toDayjs(regex((receipt: string) => {
                            return receipt.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)
                        })),
                        Hyphen: toDayjs(regex((receipt: string) => {
                            return receipt.match(/\d{1,2}\-\d{1,2}\-\d{2,4}/)
                        }))
                    }
                }
            },
        }
    }
}


const Merchant = {
    Where: {
        Between: {
            WWW: {
                And: {
                    COM: regex((receipt: string) => {
                        return receipt.toLowerCase().match(/(?!w+\.)[a-zA-Z]+(?=\s?\.(com))/g)
                    })
                }
            }
        },
        Before: {
            COM: regex((receipt: string) => {
                return receipt.toLowerCase().match(/[a-zA-Z]+(?=\s?\.\s?(co(m|n|a)))/g)
            }),
            LLC: regex((receipt: string) => {
                return receipt.toLowerCase().match(/[a-zA-Z\s\']+(?=(\,|\.)?\s?llc)/g)
            })
        }
    }
}


export default class ReceiptImageParser implements ReceiptParser<string> {

    constructor(
        private ctx: ReceiptImageParserContext
    ) {}

    getTotal(receipt: string): number {
        return (
            Amount.Where.Prefix.$(receipt)
            || Amount.Where.Prefix.None(receipt)
            || null
        )
    }
    getMerchant(receipt: string): string {
        return (
            Merchant.Where.Between.WWW.And.COM(receipt)
            || Merchant.Where.Before.COM(receipt)
            || Merchant.Where.Before.LLC(receipt)
            || null
        )
    }
    getTransactionDate(receipt: string): Dayjs {
        return (
            Date.Where.Format.mmddyyyy.And.Delimiter.Hyphen(receipt)
            || Date.Where.Format.mmddyyyy.And.Delimiter.Slash(receipt)
            || null
        )
    }
    
}