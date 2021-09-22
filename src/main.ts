import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    environment: core.getInput('environment') || undefined,
    token: core.getInput('token', { required: true }),
  })
}

main().catch((error) => core.setFailed(error))
