import {
    Category,
    TransactionResponse
} from '../models/external'

export default interface AccountClient {
    createToken(): Promise<string>
    createAccessToken(publicToken: string): Promise<string>
    syncTransactions(accountId: string, cursor?: string): Promise<TransactionResponse>
    getCategories(): Promise<Category[]>
}
