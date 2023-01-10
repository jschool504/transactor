import dayjs from 'dayjs'
import AccountClient from '../lib/interfaces/account-client'
import { Transaction } from '../lib/models/domain'
import TransactionRequest from '../lib/models/domain/transaction-request'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionRequestRepository from '../lib/repositories/transaction-request-repository'

interface TransactionRequestServiceContext {
    accountClient: AccountClient
    transactionRequestRepository: TransactionRequestRepository
    transactionRepository: TransactionRepository
}

class TransactionRequestService {
    constructor(
        private ctx: TransactionRequestServiceContext
    ) {}

    async processOpenRequests() {
        // get all open transaction requests
        await Promise.all(
            (await this.ctx.transactionRequestRepository.open())
                .map(this.processTransactionRequest.bind(this))
        )
    }

    async processTransactionRequest(request: TransactionRequest) {
        try {
            const response = await this.ctx.accountClient.syncTransactions(request.accountId, request.nextCursor)

            const existingTransactionIds = (await this.ctx.transactionRepository.all())
                .reduce((agg, tr) => ({ ...agg, [tr.transactionId]: true }), {})

            await Promise.all(response.added
                .map(async externalTransaction => {
                    if (!existingTransactionIds[externalTransaction.transaction_id]) {
                        const transaction = {
                            accountId: externalTransaction.account_id,
                            transactionId: externalTransaction.transaction_id,
                            amount: Math.ceil(externalTransaction.amount * 100),
                            name: externalTransaction.name,
                            date: dayjs(externalTransaction.authorized_date || externalTransaction.date),
                            categoryId: externalTransaction.category_id
                        }
                        return await this.ctx.transactionRepository.insert([transaction])
                    }
                    return await Promise.resolve()
                }))
                // .filter(transaction => !existingTransactionIds[transaction.transactionId])

            if (!response.has_more) {
                await this.ctx.transactionRequestRepository.setClosed(request)
            } else {
                await this.ctx.transactionRequestRepository.setNextCursor(request, response.next_cursor)
            }

        // if we hit this, it's likely an unrecoverable error, maybe from plaid
        // per endpoint docs, we need to restart the pagination process from scratch
        // so kill this transaction request
        } catch (e) {
            await this.ctx.transactionRequestRepository.setClosed(request)
        }

    }

}

export default TransactionRequestService
