import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import Event from '../models/domain/event'
import PersistedEvent from '../models/persistence/event'
import { Knex } from 'knex'
import { measure } from '../utils'


dayjs.extend(utc)
dayjs.extend(timezone)


const toPersisted = (domain: Event): PersistedEvent => ({
    id: domain.id,
    created_at: domain.createdAt.toISOString(),
    topic: domain.topic,
    message: domain.message,
    processed: domain.processed,
    processed_at: domain.processedAt && domain.processedAt.toISOString()
})

const toDomain = (persisted: PersistedEvent): Event => ({
    id: persisted.id,
    createdAt: dayjs(persisted.created_at).tz('America/New_York'),
    topic: persisted.topic,
    message: persisted.message,
    processed: persisted.processed,
    processedAt: persisted.processed_at && dayjs(persisted.processed_at).tz('America/New_York')
})

interface EventRepositoryContext {
    eventDbClient: Knex.QueryBuilder<PersistedEvent>
}

export default class EventRepository {

    constructor(
        private ctx: EventRepositoryContext
    ) {}

    @measure
    async insert(event: Event) {
        return await this.ctx.eventDbClient.insert(
            toPersisted({
                ...event,
                createdAt: dayjs().tz('America/New_York'),
            })
        )
    }

    @measure
    async markAsProcessed(event: Event) {
        return await this.ctx.eventDbClient.update(
            toPersisted({
                ...event,
                processedAt: dayjs().tz('America/New_York'),
                processed: true
            })
        )
    }

    @measure
    async unprocessed(limit: number): Promise<Event[]> {
        return (await this.ctx.eventDbClient
            .select()
            .where('processed', false)
            .limit(limit))
            .map(toDomain)
    }

}
