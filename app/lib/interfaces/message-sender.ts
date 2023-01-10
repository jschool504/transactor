export default interface MessageSender {
    sendMessage(
        chatId: any,
        text: string,
        options?: { parse_mode?: string },
    ): Promise<any>;
}
