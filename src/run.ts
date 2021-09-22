import * as core from '@actions/core'
import * as github from '@actions/github'
import { RequestError } from '@octokit/request-error'
import { DeploymentInputs, inferDeploymentParameters } from './deployment'

type Inputs = {
  token: string
} & DeploymentInputs

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = github.getOctokit(inputs.token, {
    previews: ['ant-man', 'flash'],
  })
  const p = inferDeploymentParameters(github.context, inputs)

  core.info(`Finding previous deployments for environment ${p.environment}`)
  const previous = await octokit.rest.repos.listDeployments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    environment: p.environment,
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
      if (error instanceof RequestError && error.status === 422) {
        core.warning(`unable to delete previous deployment ${deployment.url}: ${error.message}`)
        continue
      }
      throw error
    }
  }

  core.info(`Creating deployment for environment=${p.environment}, ref=${p.ref}, sha=${p.sha}`)
  const created = await octokit.rest.repos.createDeployment({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    auto_merge: false,
    required_contexts: [],
    ...p,
  })
  if (created.status != 201) {
    throw new Error(`unexpected response status ${created.status}`)
  }
  core.info(`Created deployment ${created.data.url}`)
  core.setOutput('url', created.data.url)
  core.setOutput('id', created.data.id)
  core.setOutput('node-id', created.data.node_id)
}
