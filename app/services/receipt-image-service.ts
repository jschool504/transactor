import fs from 'fs'
import { Image } from 'image-js'
import Event from '../lib/models/domain/event'
import EventService from './event-service'
import tesseract from 'node-tesseract-ocr'
import MessageClient from '../lib/interfaces/message-client'
import ReceiptParser from '../lib/interfaces/receipt-parser'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import { format } from '../lib/utils'

interface ReceiptImageServiceContext {
    eventService: EventService
    smsClient: MessageClient
    receiptImageParser: ReceiptParser<string>
    receiptRepository: ReceiptRepository
}

const TESSERACT_CONFIG = {
    lang: 'eng',
    oem: 1,
    psm: 4
}

class ReceiptImageService {
    constructor(
        private ctx: ReceiptImageServiceContext
    ) {}

   async handleNewReceiptImage(imagePath: string) {
        // validation checks
        return await this.ctx.eventService.publish({
            topic: 'RECEIPT_IMAGE_RECEIVED',
            message: JSON.stringify({
                path: imagePath
            })
        })
    }

    async processNewReceiptImage(event: Event) {
        try {
            const { path } = JSON.parse(event.message)

            // TODO: ewww
            const match = path.match(/(?!\/)[a-zA-Z0-9\_]+(?=\.jpg)/)
            const imageName = match[0]

            const imageBuffer = fs.readFileSync(path)
            const image = (await Image.load(imageBuffer))
                .grey({
                    // @ts-ignore
                    algorithm: 'lightness'
                })
                .mask({
                    // @ts-ignore
                    algorithm: 'triangle'
                })


            const receiptImageBuffer = Buffer.from(image.toBuffer())
    
            const maskedPath = `./receipts/masked-${imageName}.jpg`
            fs.writeFileSync(maskedPath, receiptImageBuffer)

            const receiptText = await tesseract
                .recognize(receiptImageBuffer, TESSERACT_CONFIG)

            console.log(receiptText)
            const merchant = this.ctx.receiptImageParser.getMerchant(receiptText)
            const amount = this.ctx.receiptImageParser.getTotal(receiptText)
            const transactionDate = this.ctx.receiptImageParser.getTransactionDate(receiptText)

            if (!merchant) {
                throw new Error(`Could not find a merchant in "${receiptText}"`)
            }

            if (!amount) {
                throw new Error(`Could not find an amount in "${receiptText}"`)
            }

            if (!transactionDate) {
                throw new Error(`Could not find a transaction date in "${receiptText}"`)
            }

            await this.ctx.receiptRepository.insert({
                merchant: merchant.toUpperCase(),
                amount,
                transactionDate,
                rawReceipt: JSON.stringify({
                    originalImage: path,
                    maskedImage: maskedPath,
                    text: receiptText
                })
            })

            await this.ctx.smsClient.send(`Added new receipt for "${merchant}" at ${transactionDate.format('MM-DD-YY')} for ${format(amount)}`)

            return { processed: true }
        } catch (e) {
            await this.ctx.smsClient.send('Failed to parse receipt image with error: ' + e.toString())
            return {
                processed: false,
                error: e.stack.toString()
            }
        }
    }

}

export default ReceiptImageService
