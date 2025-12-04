import { proxyActivities, log, sleep } from '@temporalio/workflow';
import type { KYCWorkflowInput, WorkflowResult } from './types';

interface KYCActivities {
  extractDocuments: (documents: Array<{ type: string; url: string }>) => Promise<{
    extracted: Array<{ type: string; data: unknown }>;
  }>;
  runAMLCheck: (investorId: string, documentData: unknown) => Promise<{ passed: boolean; reason?: string }>;
  checkRetailEligibility: (investorId: string, documentData: unknown) => Promise<{ eligible: boolean; tags: string[] }>;
  checkERISA: (investorId: string, documentData: unknown) => Promise<{ compliant: boolean; reason?: string }>;
  approveKYC: (investorId: string, tags: string[]) => Promise<void>;
  rejectKYC: (investorId: string, reason: string) => Promise<void>;
}

const { extractDocuments, runAMLCheck, checkRetailEligibility, checkERISA, approveKYC, rejectKYC } =
  proxyActivities<KYCActivities>({
    startToCloseTimeout: '15m',
    retry: {
      initialInterval: '1s',
      maximumAttempts: 3,
    },
  });

/**
 * KYC/Onboarding Workflow
 * Multi-step approval process for investor onboarding
 */
export async function kycWorkflow(input: KYCWorkflowInput): Promise<WorkflowResult> {
  log.info('Starting KYC workflow', { investorId: input.investorId, documentCount: input.documents.length });

  try {
    // Step 1: Extract documents
    log.info('Extracting documents', { investorId: input.investorId });
    const { extracted } = await extractDocuments(input.documents);

    // Step 2: Run AML check
    log.info('Running AML check', { investorId: input.investorId });
    const amlResult = await runAMLCheck(input.investorId, extracted);

    if (!amlResult.passed) {
      log.warn('AML check failed', { investorId: input.investorId, reason: amlResult.reason });
      await rejectKYC(input.investorId, `AML check failed: ${amlResult.reason}`);
      return {
        success: false,
        error: `AML check failed: ${amlResult.reason}`,
      };
    }

    // Step 3: Check retail eligibility (for ELTIF)
    log.info('Checking retail eligibility', { investorId: input.investorId });
    const eligibility = await checkRetailEligibility(input.investorId, extracted);

    // Step 4: Check ERISA (for US feeders)
    log.info('Checking ERISA compliance', { investorId: input.investorId });
    const erisa = await checkERISA(input.investorId, extracted);

    if (!erisa.compliant) {
      log.warn('ERISA check failed', { investorId: input.investorId, reason: erisa.reason });
      await rejectKYC(input.investorId, `ERISA check failed: ${erisa.reason}`);
      return {
        success: false,
        error: `ERISA check failed: ${erisa.reason}`,
      };
    }

    // Step 5: Combine eligibility tags
    const tags = [...eligibility.tags];
    if (erisa.compliant) {
      tags.push('erisa_compliant');
    }

    // Step 6: Approve KYC
    log.info('Approving KYC', { investorId: input.investorId, tags });
    await approveKYC(input.investorId, tags);

    // Wait a bit for async processing
    await sleep('1s');

    log.info('KYC workflow completed', { investorId: input.investorId, tags });

    return {
      success: true,
      data: {
        investorId: input.investorId,
        tags,
        eligible: eligibility.eligible,
        erisaCompliant: erisa.compliant,
      },
    };
  } catch (error) {
    log.error('KYC workflow failed', { investorId: input.investorId, error });
    await rejectKYC(input.investorId, error instanceof Error ? error.message : String(error));
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

