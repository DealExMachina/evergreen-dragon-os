import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

// Get configuration
const config = new pulumi.Config();
const environment = config.require('environment');
const region = config.get('region') || 'us-east-1';

// Create VPC
const vpc = new awsx.ec2.Vpc('evergreen-vpc', {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 2,
  tags: {
    Environment: environment,
    Project: 'evergreen-dragon-os',
  },
});

// Export VPC ID
export const vpcId = vpc.vpcId;
export const vpcCidr = vpc.vpc.cidrBlock;

// Note: Supabase, Temporal, and Langfuse are typically managed services
// This stack provides the base infrastructure (VPC, networking, etc.)
// Service-specific configurations should be added as needed:
// - Supabase: Use Supabase Cloud or provision Postgres RDS
// - Temporal: Use Temporal Cloud or provision ECS/EKS cluster
// - Langfuse: Use Langfuse Cloud or self-host on ECS/EKS

// Example: ECS Cluster for self-hosted services (optional)
const cluster = new aws.ecs.Cluster('evergreen-cluster', {
  name: `evergreen-${environment}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: {
    Environment: environment,
    Project: 'evergreen-dragon-os',
  },
});

export const clusterName = cluster.name;
export const clusterArn = cluster.arn;

// Example: S3 bucket for DuckDB snapshots
const analyticsBucket = new aws.s3.Bucket(
  'evergreen-analytics',
  {
    bucket: `evergreen-analytics-${environment}-${pulumi.getStack()}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
    tags: {
      Environment: environment,
      Project: 'evergreen-dragon-os',
      Purpose: 'analytics',
    },
  },
  {
    protect: environment === 'prod',
  }
);

export const analyticsBucketName = analyticsBucket.bucket;
export const analyticsBucketArn = analyticsBucket.arn;

// Outputs
export const environmentName = environment;
export const regionName = region;

