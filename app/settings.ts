import fs from 'fs'


interface Credentials {
    DatabaseCredentials: {
        user: string
        database: string
        host: string
        port: number
        password: string
        ssl: {
            cert: Buffer
        },
        schema: string
    }
    Phone: string
    TelegramToken: string
    PlaidClientId: string
    PlaidSecretKey: string
    HostName: string
}


interface ConfigOptions {
    SuppressSms: boolean
    port: number
    TelegramChatId: number
    DefaultSymbols: string[] | undefined // default stock tickers to use - should only be defined in development
    QuoteRetentionPeriod: number | undefined
}

interface GeneratedSettings {
    origin: string
}


type Settings = Credentials & ConfigOptions & GeneratedSettings

export default Settings

const ProtocolMapping = {
    prod: 'https',
    dev: 'http'
}

const SettingsFileNames = {
    prod: './credentials.json',
    dev: './dev-credentials.json'
}

export class SettingsManager {

    private settings: Settings

    constructor(private ctx: { env: string }) {

        const fileCredentials = JSON.parse(
            fs.readFileSync(SettingsFileNames[this.ctx.env])
                .toString()
        ) as Credentials

        const fileSettings = JSON.parse(fs.readFileSync('./settings.json').toString()) as Settings
        const options: ConfigOptions = {
            ...fileSettings,
            SuppressSms: this.ctx.env !== 'prod',
            port: {
                prod: 443,
                dev: 8000
            }[this.ctx.env]
        }

        const credentials: Credentials = {
            ...fileCredentials,
            DatabaseCredentials: {
                ...fileCredentials.DatabaseCredentials,
                ssl: this.ctx.env !== 'prod' ? null : {
                    cert: fs.readFileSync('./ca-certificate.crt')
                }
            }
        }
        
        const generated: GeneratedSettings = {
            origin: `${ProtocolMapping[this.ctx.env]}://${credentials.HostName}:${options.port}`
        }

        const settings: ConfigOptions & Credentials & GeneratedSettings = {
            ...options,
            ...credentials,
            ...generated
        }

        // if (this.ctx.env === 'prod') {
        //     console.log(settings)
        // }

        this.settings = settings
    }

    get(): Settings {
        return this.settings
    }
}

