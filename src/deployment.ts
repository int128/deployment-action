import { Context } from '@actions/github/lib/context'
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

type PartialContext = Pick<Context, 'eventName' | 'ref' | 'sha' | 'payload' | 'workflow'>

type DeploymentInputs = {
  environment?: string
}

export type DeploymentParameters = {
  ref: string
  sha: string
  environment: string
  transient_environment?: boolean
}

export const inferDeploymentParameters = (context: PartialContext, inputs: DeploymentInputs): DeploymentParameters => {
  if (context.eventName == 'pull_request') {
    const payload = context.payload as PullRequestEvent
    return {
      // set the head ref to associate a deployment with the pull request
      ref: payload.pull_request.head.ref,
      sha: context.sha,
      environment: inputs.environment ?? `pr-${payload.number}`,
      transient_environment: true,
    }
  }

  const simpleRef = context.ref.replace(/^refs\/(heads\/)?/, '')
  if (context.eventName == 'push') {
    return {
      ref: context.ref,
      sha: context.sha,
      environment: inputs.environment ?? `${simpleRef}`,
    }
  }

  return {
    ref: context.ref,
    sha: context.sha,
    environment: inputs.environment ?? `${context.workflow}/${context.eventName}`,
  }
}
