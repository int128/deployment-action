import * as core from '@actions/core'
import * as github from '@actions/github'
import * as pluginRetry from '@octokit/plugin-retry'
import { DeploymentInputs, inferDeploymentParameters } from './deployment.js'
import assert from 'assert'

type Inputs = {
  description?: string
  task?: string
  token: string
} & DeploymentInputs

type Outputs = {
  url: string
  id: number
  nodeId: string
}

export const run = async (inputs: Inputs): Promise<Outputs> => {
  const octokit = github.getOctokit(inputs.token, { previews: ['ant-man', 'flash'] }, pluginRetry.retry)
  const params = inferDeploymentParameters(github.context, inputs)

  core.info(`Finding previous deployments for environment ${params.environment}`)
  const previous = await octokit.rest.repos.listDeployments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    environment: params.environment,
  })
  core.info(`Deleting previous ${previous.data.length} deployment(s)`)
  for (const deployment of previous.data) {
    try {
      await octokit.rest.repos.deleteDeployment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        deployment_id: deployment.id,
      })
      core.info(`Deleted deployment ${deployment.url}`)
    } catch (error) {
      if (isRequestError(error)) {
        core.warning(`Unable to delete previous deployment ${deployment.url}: ${error.status} ${error.message}`)
        continue
      }
      throw error
    }
  }

  core.info(`Creating deployment for environment=${params.environment}, ref=${params.ref}, sha=${params.sha}`)
  const created = await octokit.rest.repos.createDeployment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    auto_merge: false,
    required_contexts: [],
    description: inputs.description,
    task: inputs.task,
    ...params,
  })
  assert(created.status === 201)
  core.info(`Created deployment ${created.data.url}`)
  return {
    url: created.data.url,
    id: created.data.id,
    nodeId: created.data.node_id,
  }
}

type RequestError = Error & { status: number }

const isRequestError = (error: unknown): error is RequestError =>
  error instanceof Error && 'status' in error && typeof error.status === 'number'
