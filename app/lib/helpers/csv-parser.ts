export default function parse<T>(headers: string[], rows: string[][]): T[] {
    const out = rows
        .map(row =>
            headers
                .reduce((acc, header, idx) => ({ ...acc, [header]: row[idx] }), {})
        ) as unknown as T[]
    return out
}
