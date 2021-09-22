import { Context } from '@actions/github/lib/context'
import { PullRequestEvent } from '@octokit/webhooks-types'

type PartialContext = Pick<Context, 'eventName' | 'ref' | 'sha' | 'payload' | 'workflow'>

export type DeploymentInputs = {
  environment?: string
  environmentSuffix?: string
  task: string
}

export type DeploymentParameters = {
  ref: string
  sha: string
  environment: string
  task: string
  transient_environment?: boolean
}

export const inferDeploymentParameters = (context: PartialContext, inputs: DeploymentInputs): DeploymentParameters => {
  const p = infer(context)
  return {
    ...p,
    task: inputs.task,
    environment: `${inputs.environment ?? p.environment}${inputs.environmentSuffix ?? ''}`,
  }
}

const infer = (context: PartialContext) => {
  if (context.eventName == 'pull_request') {
    const payload = context.payload as PullRequestEvent
    return {
      // set the head ref to associate a deployment with the pull request
      ref: payload.pull_request.head.ref,
      sha: context.sha,
      environment: `pr-${payload.number}`,
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
