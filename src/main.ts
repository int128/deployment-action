import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    environment: core.getInput('environment') || undefined,
    environmentSuffix: core.getInput('environment-suffix') || undefined,
    token: core.getInput('token', { required: true }),
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e.message : JSON.stringify(e)))
