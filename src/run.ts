import * as core from '@actions/core'
import * as github from '@actions/github'
import { inferDeploymentParameters } from './deployment'

type Inputs = {
  environment?: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  const octokit = github.getOctokit(inputs.token, {
    previews: ['ant-man', 'flash'],
  })
  const p = inferDeploymentParameters(github.context, inputs)

  core.info(`Finding existing deployments for environment ${p.environment}`)
  const existing = await octokit.rest.repos.listDeployments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    environment: p.environment,
  })
  await Promise.all(
    existing.data.map(async (deployment) => {
      await octokit.rest.repos.deleteDeployment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        deployment_id: deployment.id,
      })
      core.info(`Deleted deployment ${deployment.url}`)
    })
  )

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
