import fs from 'fs/promises'
import { Request, Response } from 'express'
import AccountClient from '../lib/interfaces/account-client'
import { measure } from '../lib/utils'
import SmsService from '../services/sms-service'
import AccountRepository from '../lib/repositories/account-repository'
import Email from '../lib/models/external/email'
import EmailReceptionService from '../services/email-reception-service'


interface RootControllerContext {
    smsService: SmsService
    accountClient: AccountClient
    accountRepository: AccountRepository
    emailReceptionService: EmailReceptionService
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

}
