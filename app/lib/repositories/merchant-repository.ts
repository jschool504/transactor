import { Knex } from 'knex'
import Receipt from '../models/persistence/receipt'
import { measure } from '../utils'

interface MerchantRepositoryContext {
    receiptDbClient: Knex.QueryBuilder<Receipt>
}


class MerchantRepository {

    constructor(
        private ctx: MerchantRepositoryContext
    ) {}

    @measure
    async names(): Promise<string[]> {
        return (await this.ctx.receiptDbClient.select('merchant')
            .groupBy('merchant'))
            .map(({ merchant }) => merchant)
    }

}

export default MerchantRepository
