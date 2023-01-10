import assert from 'assert'
import AccountClient from '../lib/interfaces/account-client'
import { Account, Transaction, TransactionRequest } from '../lib/models/domain'
import TransactionRepository from '../lib/repositories/transaction-repository'
import TransactionRequestRepository from '../lib/repositories/transaction-request-repository'
import TransactionRequestService from './transaction-request-service'


const UNSYNCED_TRANSACTIONS = [
    {
        account_id: '1',
        transaction_id: '987654',
        amount: 20,
        name: 'test',
        category: ['cat'],
        category_id: '3',
        date: '2023-01-09',
        authorized_date: '2023-01-09'
    },
    {
        account_id: '2',
        transaction_id: '1234',
        amount: 10,
        name: 'freeeeeeeeezey',
        category: ['cat'],
        category_id: '2',
        date: '2023-01-01',
        authorized_date: '2023-01-01'
    },
    {
        account_id: '2',
        transaction_id: '1421',
        amount: 100,
        name: 'hungry howies',
        category: ['thiscat'],
        category_id: '1',
        date: '2023-01-07',
        authorized_date: '2023-01-07'
    },
]


describe('TransactionService', () => {

    describe('when asked to process transactions requests', () => {

        it('should get transactions', async () => {

            const insertCalls = []

            const service = new TransactionRequestService({
                accountClient: {
                    syncTransactions: (accountId: string, cursor?: string) => {
                        return Promise.resolve({
                            added: UNSYNCED_TRANSACTIONS.filter((t) => t.account_id === accountId),
                            has_more: false,
                            next_cursor: null,
                        })
                    }
                } as unknown as AccountClient,
                transactionRequestRepository: {
                    open: () => {
                        console.log('open')
                        return Promise.resolve([
                            {
                                accountId: '1',
                            },
                            {
                                accountId: '2',
                            }
                        ])
                    },
                    setClosed: (request) => Promise.resolve(1),
                    setNextCursor: (request, nextCursor) => Promise.resolve(1)
                } as TransactionRequestRepository,
                transactionRepository: {
                    insert: (transactions: Transaction[]) => {
                        insertCalls.push(transactions)
                        return Promise.resolve([1])
                    },
                    all: () => {
                        return Promise.resolve([])
                    }
                } as TransactionRepository,
            })

            await service.processOpenRequests()

            assert(insertCalls.length === 3)

            const [[first], [second], [third]] = insertCalls

            assert(first.accountId === '1')
            assert(first.transactionId === '987654')
            assert(first.amount === 2000)
            assert(first.name === 'test')
            assert(first.categoryId === '3')

            assert(second.accountId === '2')
            assert(second.transactionId === '1234')
            assert(second.amount === 1000)
            assert(second.name === 'freeeeeeeeezey')
            assert(second.categoryId === '2')

            assert(third.accountId === '2')
            assert(third.transactionId === '1421')
            assert(third.amount === 10000)
            assert(third.name === 'hungry howies')
            assert(third.categoryId === '1')
        })

    })

})
