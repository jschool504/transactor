import Event from '../lib/models/domain/event'
import EventRepository from '../lib/repositories/event-repository'
import { measure } from '../lib/utils'

interface EventServiceContext {
    env: string
    eventRepository: EventRepository
    eventHandlerRegistry: (env: string) => {
        [index: string]: (event: Event) => Promise<{ processed: boolean, error: string | null }>
    }
}

export default class EventService {
    constructor(
        private ctx: EventServiceContext
    ) {}

    @measure
    async publish(event: Event) {
        return await this.ctx.eventRepository.insert({
            ...event,
            processed: false
        })
    }

    @measure
    async process() {
        const events = await this.ctx.eventRepository.unprocessed(10)
        return await Promise.all(events.map(async event => {
            const handler = this.ctx.eventHandlerRegistry(this.ctx.env)[event.topic]
            if (!handler) {
                console.error('No event handler found for ' + event.topic)
                return Promise.resolve()
            }

            const { processed, error } = await handler(event)
            if (processed) {
                return await this.ctx.eventRepository.markAsProcessed(event)
            } else {
                return await this.ctx.eventRepository.markAsTried(event, error)
            }
        }))
    }

}
