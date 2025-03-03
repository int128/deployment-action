import { Context } from './github.js'
import * as webhook from '@octokit/webhooks-types'

export type DeploymentInputs = {
  environment?: string
  environmentSuffix?: string
}

export type DeploymentParameters = {
  ref: string
  sha: string
  environment: string
  transient_environment?: boolean
}

export const inferDeploymentParameters = (context: Context, inputs: DeploymentInputs): DeploymentParameters => {
  const p = infer(context)
  return {
    ...p,
    environment: `${inputs.environment ?? p.environment}${inputs.environmentSuffix ?? ''}`,
  }
}

const infer = (context: Context): DeploymentParameters => {
  if (context.eventName === 'pull_request') {
    const payload = context.payload as webhook.PullRequestEvent
    return {
      // set the head ref to associate a deployment with the pull request
      ref: payload.pull_request.head.ref,
      sha: context.sha,
      environment: `pr-${payload.pull_request.number}`,
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
