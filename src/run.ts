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

  core.info(`Finding the previous deployments of the environment ${params.environment}`)
  const previous = await octokit.rest.repos.listDeployments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    environment: params.environment,
  })
  core.info(`Found ${previous.data.length} deployment(s)`)
  for (const deployment of previous.data) {
    try {
      await octokit.rest.repos.deleteDeployment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        deployment_id: deployment.id,
      })
      core.info(`Deleted the previous deployment ${deployment.url}`)
    } catch (error) {
      if (isRequestError(error)) {
        core.warning(`Unable to delete the previous deployment ${deployment.url}: ${error.status} ${error.message}`)
        continue
      }
      throw error
    }
  }

  core.info(`Creating a deployment of the environment ${params.environment} at ref=${params.ref}, sha=${params.sha}`)
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
  core.info(`Created a deployment ${created.data.url}`)

  // If the deployment is not deployed for a while, GitHub will show the below error.
  //   This branch had an error being deployed
  //   1 abandoned deployment
  //
  // To avoid this, set the deployment status to inactive immediately.
  const initialState = 'inactive'
  core.info(`Setting the deployment status to ${initialState}`)
  await octokit.rest.repos.createDeploymentStatus({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    deployment_id: created.data.id,
    state: initialState,
  })
  core.info(`Set the deployment status to ${initialState}`)

  return {
    url: created.data.url,
    id: created.data.id,
    nodeId: created.data.node_id,
  }
}

type RequestError = Error & { status: number }

const isRequestError = (error: unknown): error is RequestError =>
  error instanceof Error && 'status' in error && typeof error.status === 'number'
