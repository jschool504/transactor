import Context from '../app/context'
import Receipt from '../app/lib/models/domain/receipt'
import Email from '../app/lib/models/external/email'

const env = process.argv.includes('--prod') ? 'prod' : 'dev'
const shouldApplyChanges = process.argv.includes('--apply')
console.log(env, shouldApplyChanges)


const main = async () => {

    const didUpdateReceipt = (original: Receipt, updated: Receipt) => (
        original.amount !== updated.amount
        || original.merchant !== updated.merchant
        || original.transactionDate.isSame(updated.transactionDate)
    )

    const ctx = new Context(env)
    const parser = ctx.receiptEmailParser
    const receiptRepository = ctx.receiptRepository

    const receipts = await receiptRepository.all()

    const updatedReceipts = receipts.reduce((acc, receipt) => {
        const email = JSON.parse(receipt.rawReceipt) as Email

        const merchant = parser.getMerchant(email)
        const total = parser.getTotal(email)
        const transactionDate = parser.getTransactionDate(email)

        const updated = {
            ...receipt,
            merchant,
            transactionDate,
            amount: total,
        }

        const wasUpdated = didUpdateReceipt(receipt, updated)
        if (wasUpdated) {
            console.log(`"${receipt.merchant}"`, ' -> ', `"${updated.merchant}"`)
            console.log(receipt.amount, ' -> ', updated.amount)
            console.log(receipt.transactionDate.toISOString(), ' -> ', updated.transactionDate.toISOString())
            console.log()

            return [
                ...acc,
                updated
            ]
        }

        return acc
    }, [] as Receipt[])

    if (shouldApplyChanges) {
        await Promise.all(updatedReceipts.map(receiptRepository.update.bind(receiptRepository)))
    }

    process.exit(0)
}

main()
