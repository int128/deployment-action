# deployment-action [![ts](https://github.com/int128/deployment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/deployment-action/actions/workflows/ts.yaml)

This is an action to create a [GitHub Deployment](https://docs.github.com/en/rest/deployments/deployments).
It is designed to work with an external deployment system, such as Jenkins, Spinnaker or Argo CD.


## Getting Started

To create a deployment:

```yaml
jobs:
  build:
    steps:
      - uses: actions/checkout@v2
      - uses: int128/deployment-action@v1
```

This action infers the environment name as follows:

- On a pull request, the environment name is generated from the number like `pr-123`
- On push of a branch, the environment name is the branch name like `main`
- On push of a tag, the environment name is the tag name like `tags/v1.0.0`
- Otherwise, the environment name is pair of workflow name and event name, like `workflow/schedule`

For example, this action runs on a pull request, it creates the deployment like:

![screenshot](https://user-images.githubusercontent.com/321266/134269988-e4751788-379f-46bb-bb7f-2ebc4183d220.png)

You can explicitly set the environment name by the input.

This action deletes all deployments of the environment name before creation.
It keeps the timeline of pull request clean.


## Inputs

| Name | Default | Description
|------|----------|------------
| `environment` | (inferred from event) | Environment name
| `environment-suffix` | (optional) | Suffix of environment name
| `description` | (optional) | Description of environment
| `task` | (optional) | Task name of environment
| `token` | `github.token` | GitHub token


## Outputs

| Name | Description
|------|------------
| `url` | Deployment URL
| `id` | Deployment ID (for REST)
| `node-id` | Deployment ID (for GraphQL)
