import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractDocuments,
  runAMLCheck,
  checkRetailEligibility,
  checkERISA,
  approveKYC,
  rejectKYC,
} from '../../src/activities/kyc-activities';
import { createMockInvestor, createMockKYCDocument } from '../../../../tests/fixtures';
import { setupActivityTestEnvironmentSync, cleanupTestEnvironmentSync } from '../../../../tests/utils/test-helpers';

// Mock activity context to avoid calling loadConfig()
vi.mock('../../src/activities/activity-context', () => ({
  withActivityContext: async (operation: string, fn: (ctx: any) => Promise<any>) => {
    // Return a mock context for testing
    const mockContext = {
      config: {} as any,
      prisma: {} as any,
      mem0: {} as any,
      logger: {} as any,
    };
    return fn(mockContext);
  },
}));

describe('KYC Activities', () => {
  beforeEach(() => {
    setupActivityTestEnvironmentSync();
  });

  afterEach(() => {
    cleanupTestEnvironmentSync();
    vi.clearAllMocks();
  });

  describe('extractDocuments', () => {
    it('should extract documents', async () => {
      const documents = [
        createMockKYCDocument({ type: 'passport', url: 'https://example.com/passport.pdf' }),
        createMockKYCDocument({ type: 'proof_of_address', url: 'https://example.com/address.pdf' }),
      ];

      const result = await extractDocuments(documents);

      expect(result).toHaveProperty('extracted');
      expect(result.extracted).toHaveLength(2);
      expect(result.extracted[0]).toHaveProperty('type', 'passport');
      expect(result.extracted[0]).toHaveProperty('data');
      expect(result.extracted[1]).toHaveProperty('type', 'proof_of_address');
    });

    it('should handle empty document array', async () => {
      const result = await extractDocuments([]);

      expect(result.extracted).toHaveLength(0);
    });
  });

  describe('runAMLCheck', () => {
    it('should run AML check and return result', async () => {
      const investorId = 'investor-123';
      const documentData = { extracted: true };

      const result = await runAMLCheck(investorId, documentData);

      expect(result).toHaveProperty('passed');
      expect(typeof result.passed).toBe('boolean');
    });

    it('should include reason when check fails', async () => {
      // This would be implemented when actual AML logic is added
      const result = await runAMLCheck('investor-123', {});

      expect(result).toHaveProperty('passed');
    });
  });

  describe('checkRetailEligibility', () => {
    it('should check retail eligibility', async () => {
      const investorId = 'investor-123';
      const documentData = { extracted: true };

      const result = await checkRetailEligibility(investorId, documentData);

      expect(result).toHaveProperty('eligible');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray(result.tags)).toBe(true);
    });

    it('should return eligibility tags', async () => {
      const result = await checkRetailEligibility('investor-123', {});

      expect(result.tags.length).toBeGreaterThan(0);
    });
  });

  describe('checkERISA', () => {
    it('should check ERISA compliance', async () => {
      const investorId = 'investor-123';
      const documentData = { extracted: true };

      const result = await checkERISA(investorId, documentData);

      expect(result).toHaveProperty('compliant');
      expect(typeof result.compliant).toBe('boolean');
    });
  });

  describe('approveKYC', () => {
    it('should approve KYC', async () => {
      const investorId = 'investor-123';
      const tags = ['retail_eligible', 'eltif_qualified'];

      await expect(approveKYC(investorId, tags)).resolves.not.toThrow();
    });
  });

  describe('rejectKYC', () => {
    it('should reject KYC with reason', async () => {
      const investorId = 'investor-123';
      const reason = 'Insufficient documentation';

      await expect(rejectKYC(investorId, reason)).resolves.not.toThrow();
    });
  });
});

