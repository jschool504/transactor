import assert from 'assert'
import AccountClient from '../lib/interfaces/account-client'
import { Account, TransactionRequest } from '../lib/models/domain'
import AccountRepository from '../lib/repositories/account-repository'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionRequestRepository from '../lib/repositories/transaction-request-repository'
import Settings from '../settings'
import TransactionService from './transaction-service'


describe('TransactionService', () => {

    describe('when asked to fetch transactions', () => {

        it('should open transaction requests', async () => {
            const account = {
                accountId: '1',
                institution: '',
                accessToken: '',
                mask: ''
            }
            const account2 = {
                accountId: '2',
                institution: '',
                accessToken: '',
                mask: ''
            }

            const insertCalls = []

            class FakeAccountRepository extends AccountRepository {
                all() {
                    return Promise.all([account, account2])
                }
            }

            class FakeTransactionRequestRepsitory extends TransactionRequestRepository {
                insert(request: TransactionRequest) {
                    insertCalls.push(request)
                    return Promise.resolve([0])
                }
            }

            const ctx = {
                accountRepository: new FakeAccountRepository({
                    accountDbClient: {} as any
                }),
                transactionRequestRepository: new FakeTransactionRequestRepsitory({
                    transactionRequestDbClient: {} as any
                }),
                transactionRepository: {} as TransactionRepository,
                accountClient: {} as AccountClient,
                settings: {} as Settings
            }
            const service = new TransactionService(ctx)

            await service.fetchTransactions()

            assert(insertCalls.length === 2)
            const [call1, call2] = insertCalls
            assert(call1.accountId === '1')
            assert(call2.accountId === '2')
        })

    })

})
