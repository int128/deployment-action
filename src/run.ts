import * as github from './github.js'
import { Octokit } from '@octokit/action'
import { createDeployment, deleteExistingDeployments, inferDeploymentFromContext } from './deployment.js'

type Inputs = {
  environment?: string
  environmentSuffix?: string
  description?: string
  task?: string
}

type Outputs = {
  url: string
  id: number
  nodeId: string
}

export const run = async (inputs: Inputs, octokit: Octokit, context: github.Context): Promise<Outputs> => {
  const deployment = inferDeploymentFromContext(context)

  const environment = `${inputs.environment ?? deployment.environment}${inputs.environmentSuffix ?? ''}`

  await deleteExistingDeployments(
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      environment: environment,
    },
    octokit,
  )

  // If the deployment is not deployed for a while, GitHub will show the below error.
  //   This branch had an error being deployed
  //   1 abandoned deployment
  //
  // To avoid this, set the deployment status to inactive immediately.
  const initialState = 'inactive'

  const created = await createDeployment(
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      environment: environment,
      ref: deployment.ref,
      sha: deployment.sha,
      transient_environment: deployment.transient_environment,
      description: inputs.description,
      task: inputs.task,
      state: initialState,
    },
    octokit,
  )

  return {
    url: created.url,
    id: created.id,
    nodeId: created.node_id,
  }
}
