import assert from 'assert'
import * as core from '@actions/core'
import * as github from './github.js'
import { Octokit, RestEndpointMethodTypes } from '@octokit/action'

export type DeploymentRequest = {
  ref: string
  sha: string
  environment: string
  transient_environment?: boolean
}

export const inferDeploymentFromContext = (context: github.Context): DeploymentRequest => {
  if ('pull_request' in context.payload) {
    return {
      // set the head ref to associate a deployment with the pull request
      ref: context.payload.pull_request.head.ref,
      sha: context.sha,
      environment: `pr-${context.payload.pull_request.number}`,
      transient_environment: true,
    }
  }

  if (context.eventName == 'push') {
    return {
      ref: context.ref,
      sha: context.sha,
      environment: context.ref.replace(/^refs\/(heads\/)?/, ''),
    }
  }

  return {
    ref: context.ref,
    sha: context.sha,
    environment: `${context.workflow}/${context.eventName}`,
  }
}

type DeleteExistingDeployments = {
  owner: string
  repo: string
  environment: string
}

export const deleteExistingDeployments = async (req: DeleteExistingDeployments, octokit: Octokit) => {
  core.info(`Finding the deployments of ${req.environment}`)
  const deployments = await octokit.rest.repos.listDeployments({
    owner: req.owner,
    repo: req.repo,
    environment: req.environment,
  })

  core.info(`Deleting ${deployments.data.length} deployments`)
  for (const deployment of deployments.data) {
    try {
      await octokit.rest.repos.deleteDeployment({
        owner: req.owner,
        repo: req.repo,
        deployment_id: deployment.id,
      })
      core.info(`Deleted the deployment: ${deployment.url}`)
    } catch (error) {
      if (isRequestError(error)) {
        core.warning(`Unable to delete the deployment: ${deployment.url}: ${error.status} ${error.message}`)
        continue
      }
      throw error
    }
  }
}

type CreateDeployment = {
  owner: string
  repo: string
  ref: string
  sha: string
  environment: string
  transient_environment?: boolean
  description?: string
  task?: string
  state: RestEndpointMethodTypes['repos']['createDeploymentStatus']['parameters']['state']
}

export const createDeployment = async (deployment: CreateDeployment, octokit: Octokit) => {
  core.info(`Creating a deployment: ${JSON.stringify(deployment, undefined, 2)}`)
  const created = await octokit.rest.repos.createDeployment({
    owner: deployment.owner,
    repo: deployment.repo,
    ref: deployment.ref,
    sha: deployment.sha,
    environment: deployment.environment,
    transient_environment: deployment.transient_environment,
    description: deployment.description,
    task: deployment.task,
    auto_merge: false,
    required_contexts: [],
  })
  assert(created.status === 201)
  core.info(`Created a deployment: ${created.data.url}`)

  core.info(`Setting the deployment status to ${deployment.state}`)
  const { data: deploymentStatus } = await octokit.rest.repos.createDeploymentStatus({
    owner: deployment.owner,
    repo: deployment.repo,
    deployment_id: created.data.id,
    state: deployment.state,
  })
  core.info(`Created a deployment status: ${deploymentStatus.url}`)

  return created.data
}

type RequestError = Error & { status: number }

const isRequestError = (error: unknown): error is RequestError =>
  error instanceof Error && 'status' in error && typeof error.status === 'number'
