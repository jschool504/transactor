import Context from '../app/context'
import { ReceiptCategory } from '../app/lib/models/enums'

(async () => {
    const ctx = new Context('dev')

    const receipts = await ctx.receiptRepository.all()

    const remapped = receipts.map(receipt => {
        return {
            ...receipt,
            category: ctx.merchantCategoryHelper.categorize(receipt.merchant)
        }
    })

    await Promise.all(remapped.map(async r => {
        await ctx.receiptRepository.update(r)
    }))

    process.exit(0)
})()
