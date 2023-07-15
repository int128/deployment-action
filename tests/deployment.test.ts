import { DeploymentParameters, inferDeploymentParameters } from '../src/deployment'

test('on pull request', () => {
  const p = inferDeploymentParameters(
    {
      eventName: 'pull_request',
      ref: 'refs/pulls/123/merge',
      sha: '1234567890abcdef',
      payload: {
        number: 123,
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

test('on pull request with suffix', () => {
  const p = inferDeploymentParameters(
    {
      eventName: 'pull_request',
      ref: 'refs/pulls/123/merge',
      sha: '1234567890abcdef',
      payload: {
        number: 123,
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

test('on push branch', () => {
  const p = inferDeploymentParameters(
    {
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

test('on push tag', () => {
  const p = inferDeploymentParameters(
    {
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

test('on schedule', () => {
  const p = inferDeploymentParameters(
    {
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
