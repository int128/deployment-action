import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit, RestEndpointMethodTypes } from '@octokit/action'
import type * as github from './github.js'

export type DeploymentContext = {
  ref: string
  sha: string
  environment: string
  transient_environment?: boolean
}

export const inferDeploymentFromContext = (context: github.Context): DeploymentContext => {
  if ('pull_request' in context.payload) {
    return {
      // set the head ref to associate a deployment with the pull request
      ref: context.payload.pull_request.head.ref,
      sha: context.sha,
      environment: `pr-${context.payload.pull_request.number}`,
      transient_environment: true,
    }
  }

  if (context.eventName === 'push') {
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

export const createDeployment = async (req: CreateDeployment, octokit: Octokit) => {
  core.info(`Creating a deployment: ${JSON.stringify(req, undefined, 2)}`)
  const created = await octokit.rest.repos.createDeployment({
    owner: req.owner,
    repo: req.repo,
    ref: req.ref,
    sha: req.sha,
    environment: req.environment,
    transient_environment: req.transient_environment,
    description: req.description,
    task: req.task,
    auto_merge: false,
    required_contexts: [],
  })
  assert.strictEqual(created.status, 201)
  core.info(`Created a deployment: ${created.data.url}`)

  core.info(`Setting the deployment status to ${req.state}`)
  const { data: deploymentStatus } = await octokit.rest.repos.createDeploymentStatus({
    owner: req.owner,
    repo: req.repo,
    deployment_id: created.data.id,
    state: req.state,
  })
  core.info(`Created a deployment status: ${deploymentStatus.url}`)

  return created.data
}

type RequestError = Error & { status: number }

const isRequestError = (error: unknown): error is RequestError =>
  error instanceof Error && 'status' in error && typeof error.status === 'number'
