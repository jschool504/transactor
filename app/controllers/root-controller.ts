import fs from 'fs/promises'
import { Request, Response } from 'express'
import AccountClient from '../lib/interfaces/account-client'
import { measure, memo } from '../lib/utils'
import SmsService from '../services/sms-service'
import AccountRepository from '../lib/repositories/account-repository'
import Email from '../lib/models/external/email'
import EmailReceptionService from '../services/email-reception-service'
import { NewReceipt } from '../lib/models/domain/receipt'
import ReceiptRepository from '../lib/repositories/receipt-repository'
import Settings from '../settings'
import dayjs from 'dayjs'
import createMerchantNameNormalizer from '../lib/helpers/normalize-merchant'
import MerchantRepository from '../lib/repositories/merchant-repository'
import MerchantCategoryHelper from '../lib/helpers/merchant-category-helper'


interface RootControllerContext {
    smsService: SmsService
    accountClient: AccountClient
    accountRepository: AccountRepository
    emailReceptionService: EmailReceptionService
    receiptRepository: ReceiptRepository
    merchantRepository: MerchantRepository
    merchantCategoryHelper: MerchantCategoryHelper
    settings: Settings
}


interface NewReceiptRequest {
    merchant: string
    date: string
    amount: number
}

export default class RootController {

    constructor(
        private ctx: RootControllerContext
    ) {}

    @measure
    async status(request: Request, response: Response) {
        response.send({
            ok: true
        })
    }

    @measure
    async message(request: Request, response: Response) {
        try {
            const result = await this.ctx.smsService.handle(request.body)
            response.send(result)
        } catch (e) {
            response.send({
                message: "error processing message",
                error: e.toString()
            })
        }
    }

    @measure
    async createAccount(request: Request, response: Response) {
        const body: {
            mask: string
            accounts: { mask: string, id: string, name: string }[]
            institution: string
            publicToken: string
        } = request.body

        const accessToken = await this.ctx.accountClient.createAccessToken(body.publicToken)

        body.accounts.forEach(async account => {
            await this.ctx.accountRepository.insert({
                id: undefined,
                accountId: account.id,
                institution: body.institution,
                mask: account.mask,
                accessToken
            })
        })

        response.send(body)
    }

    @measure
    async newAccountPage(request: Request, response: Response) {
        const token = await this.ctx.accountClient.createToken()
        const html = (await fs.readFile('app/pages/new-account-page.html'))
            .toString()
            .replace('$TOKEN', token)
        response.send(html)
    }

    @measure
    async newEmail(request: Request, response: Response) {
        const body = request.body as Email
        try {
            await this.ctx.emailReceptionService.handleEmailReceived(body)
            response.send({
                ok: true
            })
        } catch (e) {
            response.send({
                message: "error processing message",
                error: e.toString()
            })
        }
    }

    // @memo()
    async getNewReceiptPageHtml() {
        return (await fs.readFile('app/pages/new-receipt-page.html'))
            .toString()
            .replace('$ORIGIN', this.ctx.settings.origin)
    }

    @measure
    async newReceiptPage(request: Request, response: Response) {
        const html = await this.getNewReceiptPageHtml()
        response.send(html)
    }

    @measure
    async createNewReceipt(request: Request, response: Response) {
        try {
            const receipt = request.body as NewReceiptRequest
            const normalizedMerchantName = createMerchantNameNormalizer(await this.ctx.merchantRepository.names())(receipt.merchant)
            const category = this.ctx.merchantCategoryHelper.categorize(normalizedMerchantName)
            await this.ctx.receiptRepository.insert({
                merchant: receipt.merchant,
                transactionDate: dayjs(receipt.date),
                amount: receipt.amount,
                rawReceipt: JSON.stringify(request.body),
                category: category
            })
            response
                .status(201)
                .send({
                    ok: true
                })
        } catch (e) {
            response
                .status(500)
                .send({
                    message: 'error creating receipt',
                    error: e.stack.toString()
                })
        }
    }

}
