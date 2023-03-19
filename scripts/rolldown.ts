import Context from '../app/context'

(async () => {
    const devCtx = new Context('dev')
    const prodCtx = new Context('prod')

    const receipts = await prodCtx.receiptRepository.all()

    await Promise.all(
        receipts.map(async r => {
            r.id = undefined
            console.log(await devCtx.receiptRepository.insert(r))
        })
    )

    process.exit(0)
})()
