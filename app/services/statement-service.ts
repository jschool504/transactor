import fs from 'fs'

interface StatementServiceContext {
    eventService
}

class StatementService {
    constructor(
        private ctx: StatementServiceContext
    ) {}

    async handleStatement(path: string) {
        const rawStatement = fs.readFileSync(path)
            .toString()
            .trim()
            .split('\n')
            .map(s => s
                .replaceAll(/(\'|\")/g, '')
                .split('\,')
            )

        console.log(rawStatement)
        console.log(rawStatement[0])
    }
}

export default StatementService