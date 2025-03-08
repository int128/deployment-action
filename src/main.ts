import * as core from '@actions/core'
import * as github from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  const outputs = await run(
    {
      environment: core.getInput('environment') || undefined,
      environmentSuffix: core.getInput('environment-suffix') || undefined,
      description: core.getInput('description') || undefined,
      task: core.getInput('task') || undefined,
    },
    github.getOctokit(),
    await github.getContext(),
  )
  core.info(`Setting outputs: ${JSON.stringify(outputs, undefined, 2)}`)
  core.setOutput('url', outputs.url)
  core.setOutput('id', outputs.id)
  core.setOutput('node-id', outputs.nodeId)
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
