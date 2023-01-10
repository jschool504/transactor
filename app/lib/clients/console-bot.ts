import MessageSender from '../interfaces/message-sender'

class ConsoleBot implements MessageSender {
    constructor(ctx: {}) {}

    on(channel: string, callback: (msg: { text: string, chat: { id: number } }) => void) {
        if (channel === 'text') {
            process.stdin.on('data', (data) => {
                callback({ text: data.toString(), chat: { id: 0 } })
            })
        } else {
            throw new Error('not implemented')
        }
    }

    sendMessage(chatId: any, text: string, options?: { parse_mode?: string }): Promise<any> {
        return Promise.resolve('done')
    }
}

export default ConsoleBot
