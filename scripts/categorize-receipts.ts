import Context from '../app/context'
import { ReceiptCategory } from '../app/lib/models/enums'

(async () => {
    const ctx = new Context('prd')

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

    // const normalize = normalizeMerchant(merchants)

    // const fixedMerchants = receipts.map((receipt) => {
    //     return {
    //         ...receipt,
    //         merchant: normalize(receipt.merchant)
    //     }
    // })

    // await Promise.all(fixedMerchants.map(async receipt => {
    //     await ctx.receiptRepository.update(receipt)
    // }))

    process.exit(0)
})()
