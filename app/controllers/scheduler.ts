import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

interface IntervalJob {
    runOnStart: boolean
    interval?: number
    at?: string
    timezone?: string
    function: Function
}

const MILLISECOND = 1
const SECOND = 1000

export default class Scheduler {

    intervalJobs: IntervalJob[] = []
    intervalJobIds: NodeJS.Timer[] = []

    constructor() {}

    add(job: IntervalJob) {
        this.intervalJobs.push(job)
    }

    /**
     * starts all jobs
     */
    start() {
        this.intervalJobs.forEach((job, index) => {

            const id = setInterval(() => {

                if (job.at) {
                    const now = dayjs().tz(job.timezone || 'utc')

                    const isTimeToRunJob = now.format().includes(job.at)

                    if (isTimeToRunJob) {
                        job.function()
                    }
                } else {
                    job.function()
                }

                
            }, job.interval || (1 * SECOND))
            this.intervalJobIds.push(id)

            if (job.runOnStart) {
               job.function()
            }

        })
    }

    stop() {
        this.intervalJobIds.forEach(id => clearInterval(id))
    }

}
