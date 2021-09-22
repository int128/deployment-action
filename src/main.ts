import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    environment: core.getInput('environment') || undefined,
    environmentSuffix: core.getInput('environment-suffix') || undefined,
    task: core.getInput('task', { required: true }),
    token: core.getInput('token', { required: true }),
  })
}

main().catch((error) => core.setFailed(error))
