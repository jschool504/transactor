import AccountClient from '../lib/interfaces/account-client'
import AccountRepository from '../lib/repositories/account-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionRequestRepository from '../lib/repositories/transaction-request-repository'
import { measure } from '../lib/utils'
import Settings from '../settings'

interface TransactionServiceContext {
    accountRepository: AccountRepository
    transactionRequestRepository: TransactionRequestRepository
    transactionRepository: TransactionRepository
    accountClient: AccountClient
    settings: Settings
}

class TransactionService {
    constructor(
        private ctx: TransactionServiceContext
    ) {}

    // kick off transaction requests for all accounts
    @measure
    async fetchTransactions() {
        const accounts = await this.ctx.accountRepository.all()
        await Promise.all(accounts.map(async account => {
            try {
                return await this.ctx.transactionRequestRepository.insert({
                    accountId: account.accountId,
                    nextCursor: null,
                    open: true,
                })
            } catch (e) {
                console.error(e)
                return Promise.resolve()
            }
        }))
    }

}

export default TransactionService
