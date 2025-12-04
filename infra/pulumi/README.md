# Pulumi Infrastructure

This directory contains Pulumi IaC stacks for provisioning cloud infrastructure.

## Prerequisites

- Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
- AWS credentials configured
- Pulumi account and access token

## Stacks

- `dev`: Development environment
- `staging`: Staging environment
- `prod`: Production environment

## Usage

### Login to Pulumi

```bash
pulumi login
```

### Select a stack

```bash
pulumi stack select dev
```

### Configure stack settings

```bash
pulumi config set aws:region us-east-1
pulumi config set evergreen:environment dev
```

### Preview changes

```bash
pulumi preview
```

### Apply changes

```bash
pulumi up
```

### Destroy infrastructure

```bash
pulumi destroy
```

## Stack Configuration

Each stack has its own configuration file:
- `Pulumi.dev.yaml`
- `Pulumi.staging.yaml`
- `Pulumi.prod.yaml`

## Outputs

After running `pulumi up`, outputs are available:
- VPC ID and CIDR
- ECS Cluster name and ARN
- S3 bucket names and ARNs

## Notes

- Supabase, Temporal, and Langfuse are typically managed services
- This stack provides base infrastructure (VPC, networking, ECS, S3)
- Service-specific provisioning should be added as needed
- Production stacks are protected by default

