export default interface Event {
    id?: number
    created_at: string
    topic: string
    message: string
    processed_at: string
    processed: boolean
}
