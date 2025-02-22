import assert from 'assert'
import * as fs from 'fs/promises'
import { retry } from '@octokit/plugin-retry'
import { Octokit } from '@octokit/action'

export const getOctokit = () => new (Octokit.plugin(retry))()

export type Context = {
  repo: {
    owner: string
    repo: string
  }
  eventName: string
  payload: unknown
  ref: string
  sha: string
  workflow: string
}

export const getContext = async (): Promise<Context> => {
  // https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
  assert(process.env.GITHUB_REPOSITORY, 'GITHUB_REPOSITORY is required')
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')

  assert(process.env.GITHUB_EVENT_PATH, 'GITHUB_EVENT_PATH is required')
  const payload = JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, 'utf-8')) as unknown

  assert(process.env.GITHUB_EVENT_NAME, 'GITHUB_EVENT_NAME is required')
  assert(process.env.GITHUB_REF, 'GITHUB_REF is required')
  assert(process.env.GITHUB_SHA, 'GITHUB_SHA is required')
  assert(process.env.GITHUB_WORKFLOW, 'GITHUB_WORKFLOW is required')

  return {
    repo: { owner, repo },
    eventName: process.env.GITHUB_EVENT_NAME,
    payload,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    workflow: process.env.GITHUB_WORKFLOW,
  }
}
