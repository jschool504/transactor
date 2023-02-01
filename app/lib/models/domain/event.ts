import { Dayjs } from 'dayjs'

export default interface Event {
    id?: number
    topic: string
    message: string
    createdAt?: Dayjs
    processedAt?: Dayjs
    processed?: boolean
    retries?: number,
    error?: string
}
