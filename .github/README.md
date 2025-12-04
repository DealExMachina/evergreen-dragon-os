# GitHub Repository Configuration

This directory contains GitHub-specific configuration files.

## Files

- `workflows/ci.yml` - Continuous Integration workflow
- `PULL_REQUEST_TEMPLATE.md` - Template for pull requests
- `BRANCH_PROTECTION.md` - Recommended branch protection settings

## Setup Instructions

After creating the repository on GitHub:

1. Go to Settings → Branches
2. Add branch protection rule for `main`
3. Follow the settings outlined in `BRANCH_PROTECTION.md`

## CI/CD

The CI workflow runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

It executes:
- Type checking
- Linting
- Tests

