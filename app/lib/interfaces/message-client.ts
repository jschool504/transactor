export default interface MessageClient {
    send(message: string, markdown?: boolean): Promise<any>
}
