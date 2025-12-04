import { proxyActivities, log } from '@temporalio/workflow';
import type { ValuationCycleInput, WorkflowResult } from './types';

interface ValuationActivities {
  fetchAppraisals: (assetIds: string[]) => Promise<Array<{ assetId: string; appraisal: unknown }>>;
  ocrDocuments: (documentUrl: string) => Promise<Record<string, unknown>>;
  modelValuation: (
    assetId: string,
    data: unknown
  ) => Promise<{ valuation: number; confidence: number }>;
  checkAdminNAV: (
    assetId: string,
    computedNAV: number
  ) => Promise<{ matches: boolean; adminNAV: number }>;
  postResults: (
    results: Array<{ assetId: string; nav: number; confidence: number }>
  ) => Promise<void>;
}

const { fetchAppraisals, ocrDocuments, modelValuation, checkAdminNAV, postResults } =
  proxyActivities<ValuationActivities>({
    startToCloseTimeout: '30m',
    retry: {
      initialInterval: '1s',
      maximumAttempts: 3,
    },
  });

/**
 * Quarterly Valuation Workflow
 * Runs valuation cycle for assets
 */
export async function valuationCycleWorkflow(input: ValuationCycleInput): Promise<WorkflowResult> {
  log.info('Starting valuation cycle workflow', {
    quarter: input.quarter,
    year: input.year,
    assetCount: input.assetIds?.length || 0,
  });

  try {
    const assetIds = input.assetIds || [];
    const results: Array<{ assetId: string; nav: number; confidence: number }> = [];

    // Step 1: Fetch appraisals
    log.info('Fetching appraisals', { assetCount: assetIds.length });
    const appraisals = await fetchAppraisals(assetIds);

    // Step 2: Process each asset
    for (const { assetId, appraisal } of appraisals) {
      log.info('Processing asset valuation', { assetId });

      // OCR documents if needed
      let documentData: Record<string, unknown> = {};
      if (appraisal && typeof appraisal === 'object' && 'documentUrl' in appraisal) {
        documentData = await ocrDocuments(appraisal.documentUrl as string);
      }

      // Model valuation
      const valuation = await modelValuation(assetId, {
        ...(appraisal && typeof appraisal === 'object' ? appraisal : {}),
        ...documentData,
        quarter: input.quarter,
        year: input.year,
      });

      // Check against admin NAV
      const navCheck = await checkAdminNAV(assetId, valuation.valuation);

      if (!navCheck.matches) {
        log.warn('NAV mismatch detected', {
          assetId,
          computed: valuation.valuation,
          admin: navCheck.adminNAV,
        });
      }

      results.push({
        assetId,
        nav: valuation.valuation,
        confidence: valuation.confidence,
      });
    }

    // Step 3: Post results
    log.info('Posting valuation results', { resultCount: results.length });
    await postResults(results);

    log.info('Valuation cycle workflow completed', {
      quarter: input.quarter,
      year: input.year,
      processedCount: results.length,
    });

    return {
      success: true,
      data: {
        quarter: input.quarter,
        year: input.year,
        results,
      },
    };
  } catch (error) {
    log.error('Valuation cycle workflow failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
