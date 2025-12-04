import type { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@evergreen/shared-utils';
import { SupabaseError } from '@evergreen/shared-utils';

/**
 * Calls a Supabase RPC function with type safety
 */
export async function callRPC<T = unknown>(
  client: SupabaseClient,
  functionName: string,
  params?: Record<string, unknown>
): Promise<T> {
  const logger = getLogger();
  logger.debug(`Calling RPC: ${functionName}`, { params });

  const { data, error } = await client.rpc(functionName, params || {});

  if (error) {
    logger.error(`RPC call failed: ${functionName}`, error);
    throw new SupabaseError(`RPC call failed: ${functionName}`, {
      functionName,
      params,
      error: error.message,
    });
  }

  return data as T;
}

/**
 * Common RPC function wrappers for Evergreen operations
 */
export class EvergreenRPC {
  constructor(private client: SupabaseClient) {}

  /**
   * Triggers a workflow via RPC
   */
  async triggerWorkflow(workflowType: string, payload: Record<string, unknown>): Promise<{ workflowId: string }> {
    return callRPC<{ workflowId: string }>(this.client, 'trigger_workflow', {
      workflow_type: workflowType,
      payload,
    });
  }

  /**
   * Records a compliance check
   */
  async recordComplianceCheck(
    actor: string,
    rule: string,
    result: 'approved' | 'denied',
    attachmentUrl?: string
  ): Promise<{ logId: string }> {
    return callRPC<{ logId: string }>(this.client, 'record_compliance_check', {
      actor,
      rule,
      result,
      attachment_url: attachmentUrl,
    });
  }

  /**
   * Updates liquidity ladder
   */
  async updateLiquidityLadder(
    bucket: string,
    capacity: number,
    utilization: number
  ): Promise<{ success: boolean }> {
    return callRPC<{ success: boolean }>(this.client, 'update_liquidity_ladder', {
      bucket,
      capacity,
      utilization,
    });
  }
}

