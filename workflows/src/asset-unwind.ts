import { proxyActivities, log } from '@temporalio/workflow';
import type { AssetUnwindInput, WorkflowResult } from './types';

// Define activity types (implemented in workflows-service)
interface AssetUnwindActivities {
  requestBids: (assetId: string) => Promise<Array<{ bidder: string; amount: number; haircut: number }>>;
  computeHaircut: (assetId: string, bids: Array<{ bidder: string; amount: number; haircut: number }>) => Promise<number>;
  settleTransaction: (assetId: string, bidder: string, amount: number) => Promise<{ txId: string }>;
  updateNAV: (assetId: string, amount: number) => Promise<void>;
  saveToMem0: (summary: string, referenceIds: string[]) => Promise<void>;
}

const { requestBids, computeHaircut, settleTransaction, updateNAV, saveToMem0 } =
  proxyActivities<AssetUnwindActivities>({
    startToCloseTimeout: '10m',
    retry: {
      initialInterval: '1s',
      maximumAttempts: 3,
    },
  });

/**
 * Asset Unwind Workflow
 * Handles the complete process of unwinding an asset
 */
export async function assetUnwindWorkflow(input: AssetUnwindInput): Promise<WorkflowResult> {
  log.info('Starting asset unwind workflow', { assetId: input.assetId, reason: input.reason });

  try {
    // Step 1: Request bids
    log.info('Requesting bids for asset', { assetId: input.assetId });
    const bids = await requestBids(input.assetId);

    if (bids.length === 0) {
      log.warn('No bids received for asset', { assetId: input.assetId });
      return {
        success: false,
        error: 'No bids received',
      };
    }

    // Step 2: Compute haircut
    log.info('Computing haircut', { assetId: input.assetId, bidCount: bids.length });
    const haircut = await computeHaircut(input.assetId, bids);

    // Step 3: Select best bid
    const bestBid = bids.reduce((best, current) => {
      return current.amount > best.amount ? current : best;
    });

    log.info('Selected best bid', {
      assetId: input.assetId,
      bidder: bestBid.bidder,
      amount: bestBid.amount,
      haircut,
    });

    // Step 4: Settle transaction
    log.info('Settling transaction', { assetId: input.assetId, bidder: bestBid.bidder });
    const settlement = await settleTransaction(input.assetId, bestBid.bidder, bestBid.amount);

    // Step 5: Update NAV
    log.info('Updating NAV', { assetId: input.assetId, amount: bestBid.amount });
    await updateNAV(input.assetId, bestBid.amount);

    // Step 6: Save to mem0
    const summary = `Asset ${input.assetId} unwound for ${bestBid.amount} with ${haircut}% haircut. Reason: ${input.reason}`;
    await saveToMem0(summary, [input.assetId, settlement.txId]);

    log.info('Asset unwind workflow completed', {
      assetId: input.assetId,
      txId: settlement.txId,
    });

    return {
      success: true,
      data: {
        assetId: input.assetId,
        bidder: bestBid.bidder,
        amount: bestBid.amount,
        haircut,
        txId: settlement.txId,
      },
    };
  } catch (error) {
    log.error('Asset unwind workflow failed', { assetId: input.assetId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

