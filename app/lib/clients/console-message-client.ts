import MessageClient from '../interfaces/message-client'

export default class ConsoleMessageClient implements MessageClient {

    constructor(ctx: {}) {}

    async send(message: string, markdown?: boolean): Promise<any> {
        console.log(`[MESSAGE markdown: ${markdown}]: `, `${message}`)
    }

}
