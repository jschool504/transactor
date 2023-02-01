import Settings from '../../settings'
import MessageClient from '../interfaces/message-client'
import MessageSender from '../interfaces/message-sender'
import { measure } from '../utils'

interface TelegramClientContext {
    telegramBot: MessageSender
    settings: Settings
}

export default class TelegramClient implements MessageClient {

    constructor(
        private ctx: TelegramClientContext
    ) {}

    @measure
    async send(message: string, markdown?: boolean): Promise<any> {
        const cleanMessage = {
            true: (msg: string) => msg
                .replaceAll('.', '\\.')
                .replaceAll('*', '\\*')
                .replaceAll('-', '\\-')
                .replaceAll('#', '\\#')
                .replaceAll('(', '\\(')
                .replaceAll(')', '\\)')
                .replaceAll('!', '\\!'),
            false: (msg: string) => msg,
        }[(markdown || false).toString()](message)

        return await this.ctx.telegramBot.sendMessage(this.ctx.settings.TelegramChatId, cleanMessage, { parse_mode: markdown ? 'MarkdownV2' : undefined })
    }

}
