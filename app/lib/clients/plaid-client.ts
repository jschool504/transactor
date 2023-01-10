import { PlaidApi, Products, CountryCode } from 'plaid'

import Settings from '../../settings'
import AccountClient from '../interfaces/account-client'
import { Category } from '../models/external'
import { TransactionResponse } from '../models/external/transaction'
import AccountRepository from '../repositories/account-repository'
import { memo } from '../../lib/utils'


interface PlaidClientContext {
    accountRepository: AccountRepository
    plaidApi: PlaidApi
    settings: Settings
}


class PlaidClient implements AccountClient {

    constructor(
        private ctx: PlaidClientContext
    ) {}

    async createToken(): Promise<string> {
        const response = await this.ctx.plaidApi.linkTokenCreate({
            user: {
              client_user_id: '1',
            },
            client_name: 'Transactor',
            products: [Products.Transactions],
            country_codes: [CountryCode.Us],
            language: 'en'
        })

        return response.data.link_token
    }

    async createAccessToken(publicToken: string): Promise<string> {
        const response = await this.ctx.plaidApi.itemPublicTokenExchange({
            client_id: this.ctx.settings.PlaidClientId,
            secret: this.ctx.settings.PlaidSecretKey,
            public_token: publicToken
        })

        return response.data.access_token
    }

    // TODO: accept account id
    async syncTransactions(accountId: string, cursor?: string): Promise<any> {
        const account = await this.ctx.accountRepository.findByAccountId(accountId)

        const response = await this.ctx.plaidApi.transactionsSync({
            client_id: this.ctx.settings.PlaidClientId,
            secret: this.ctx.settings.PlaidSecretKey,
            access_token: account.accessToken,
            cursor: cursor,
            // count: 25
        })

        return response.data as TransactionResponse
    }

    @memo()
    async getCategories(): Promise<Category[]> {
        const response = await this.ctx.plaidApi.categoriesGet({})
        return response.data.categories as Category[]
    }

}

export default PlaidClient
