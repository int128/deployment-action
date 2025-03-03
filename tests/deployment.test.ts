import { it, expect } from 'vitest'
import { DeploymentParameters, inferDeploymentParameters } from '../src/deployment.js'

it('returns the pull request number', () => {
  const p = inferDeploymentParameters(
    {
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'pull_request',
      ref: 'refs/pulls/123/merge',
      sha: '1234567890abcdef',
      payload: {
        pull_request: {
          number: 123,
          head: {
            ref: 'headname',
          },
        },
      },
      workflow: 'test',
    },
    {},
  )
  expect(p).toStrictEqual<DeploymentParameters>({
    ref: 'headname',
    sha: '1234567890abcdef',
    environment: 'pr-123',
    transient_environment: true,
  })
})

it('returns the pull request number with suffix', () => {
  const p = inferDeploymentParameters(
    {
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'pull_request',
      ref: 'refs/pulls/123/merge',
      sha: '1234567890abcdef',
      payload: {
        pull_request: {
          number: 123,
          head: {
            ref: 'headname',
          },
        },
      },
      workflow: 'test',
    },
    { environmentSuffix: '/app1' },
  )
  expect(p).toStrictEqual<DeploymentParameters>({
    ref: 'headname',
    sha: '1234567890abcdef',
    environment: 'pr-123/app1',
    transient_environment: true,
  })
})

it('returns the pushed branch', () => {
  const p = inferDeploymentParameters(
    {
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'push',
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      payload: {},
      workflow: 'test',
    },
    {},
  )
  expect(p).toStrictEqual<DeploymentParameters>({
    ref: 'refs/heads/main',
    sha: '1234567890abcdef',
    environment: 'main',
  })
})

it('returned the pushed tag', () => {
  const p = inferDeploymentParameters(
    {
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'push',
      ref: 'refs/tags/main',
      sha: '1234567890abcdef',
      payload: {},
      workflow: 'test',
    },
    {},
  )
  expect(p).toStrictEqual<DeploymentParameters>({
    ref: 'refs/tags/main',
    sha: '1234567890abcdef',
    environment: 'tags/main',
  })
})

it('returns the current branch on schedule event', () => {
  const p = inferDeploymentParameters(
    {
      repo: { owner: 'owner', repo: 'repo' },
      eventName: 'schedule',
      ref: 'refs/heads/main',
      sha: '1234567890abcdef',
      payload: {},
      workflow: 'deploy',
    },
    {},
  )
  expect(p).toStrictEqual<DeploymentParameters>({
    ref: 'refs/heads/main',
    sha: '1234567890abcdef',
    environment: 'deploy/schedule',
  })
})
