import { Knex } from 'knex'
import * as domain from '../models/domain'
import { Account } from '../models/persistence'
import { measure } from '../utils'

interface AccountRepositoryContext {
    accountDbClient: Knex.QueryBuilder<Account>
}

const toPersisted = (domain: domain.Account): Account => ({
    id: domain.id,
    account_id: domain.accountId,
    institution: domain.institution,
    access_token: domain.accessToken,
    mask: domain.mask
})

const toDomain = (persisted: Account): domain.Account => ({
    id: persisted.id,
    accountId: persisted.account_id,
    institution: persisted.institution,
    accessToken: persisted.access_token,
    mask: persisted.mask
})


class AccountRepository {
    private ctx: AccountRepositoryContext

    constructor(ctx: AccountRepositoryContext) {
        this.ctx = ctx
    }

    async findByAccountId(accountId: string): Promise<domain.Account> {
        const [persisted] = await this.ctx.accountDbClient
            .select()
            .where('account_id', accountId)
            .limit(1)
        return toDomain(persisted)
    }

    @measure
    async insert(account: domain.Account) {
        return await this.ctx.accountDbClient.insert(
            toPersisted(account)
        )
    }

    @measure
    async all(): Promise<domain.Account[]> {
        return (await this.ctx.accountDbClient.select()).map(toDomain)
    }

}

export default AccountRepository
