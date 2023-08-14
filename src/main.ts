import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    environment: core.getInput('environment') || undefined,
    environmentSuffix: core.getInput('environment-suffix') || undefined,
    description: core.getInput('description') || undefined,
    task: core.getInput('task') || undefined,
    token: core.getInput('token', { required: true }),
  })
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
