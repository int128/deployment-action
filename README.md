# deployment-action [![ts](https://github.com/int128/deployment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/deployment-action/actions/workflows/ts.yaml)

This is an action to create a [deployment](https://docs.github.com/en/rest/reference/repos#deployments).
It is designed to work with an external deployment system.


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

You can implicitly set the environment name by the input.

This action deletes all deployments of the environment name before creation.
It keeps the timeline of pull request clean.


## Inputs

| Name | Default | Description
|------|----------|------------
| `environment` | (inferred from event) | environment name
| `token` | `github.token` | GitHub token


## Outputs

| Name | Description
|------|------------
| `url` | deployment url
| `id` | deployment ID (for REST)
| `node-id` | deployment ID (for GraphQL)
