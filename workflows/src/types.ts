/**
 * Shared types for Temporal workflows
 */

export interface WorkflowInput {
  workflowId: string;
  [key: string]: unknown;
}

export interface WorkflowResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AssetUnwindInput extends WorkflowInput {
  assetId: string;
  targetAmount?: number;
  reason: string;
}

export interface ValuationCycleInput extends WorkflowInput {
  quarter: string;
  year: number;
  assetIds?: string[];
}

export interface StressTestInput extends WorkflowInput {
  scenarioName: string;
  parameters: Record<string, number>;
  assetIds?: string[];
}

export interface KYCWorkflowInput extends WorkflowInput {
  investorId: string;
  documents: Array<{
    type: string;
    url: string;
  }>;
}

