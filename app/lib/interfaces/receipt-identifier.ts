export default interface ReceiptIdentifier<T, U> {
    identify: (input: T) => U
}
