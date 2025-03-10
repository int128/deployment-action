import { it, expect, describe } from 'vitest'
import { WebhookEvent } from '@octokit/webhooks-types'
import { DeploymentContext, inferDeploymentFromContext } from '../src/deployment.js'

const partialPayloadForTest = (payload: object) => payload as WebhookEvent

describe('inferDeploymentFromContext', () => {
  it('returns the pull request number', () => {
    const deployment = inferDeploymentFromContext({
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'pull_request',
      ref: 'refs/pulls/123/merge',
      sha: '1234567890abcdef',
      payload: partialPayloadForTest({
        pull_request: {
          number: 123,
          head: {
            ref: 'headname',
          },
        },
      }),
      workflow: 'test',
    })
    expect(deployment).toStrictEqual<DeploymentContext>({
      ref: 'headname',
      sha: '1234567890abcdef',
      environment: 'pr-123',
      transient_environment: true,
    })
  })

  it('returns the pushed branch', () => {
    const deployment = inferDeploymentFromContext({
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'push',
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      payload: partialPayloadForTest({}),
      workflow: 'test',
    })
    expect(deployment).toStrictEqual<DeploymentContext>({
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      environment: 'main',
    })
  })

  it('returned the pushed tag', () => {
    const deployment = inferDeploymentFromContext({
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'push',
      ref: 'refs/tags/main',
      sha: '1234567890abcdef',
      payload: partialPayloadForTest({}),
      workflow: 'test',
    })
    expect(deployment).toStrictEqual<DeploymentContext>({
      ref: 'refs/tags/main',
      sha: '1234567890abcdef',
      environment: 'tags/main',
    })
  })

  it('returns the current branch on schedule event', () => {
    const deployment = inferDeploymentFromContext({
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'schedule',
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      payload: partialPayloadForTest({}),
      workflow: 'deploy',
    })
    expect(deployment).toStrictEqual<DeploymentContext>({
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      environment: 'deploy/schedule',
    })
  })
})
