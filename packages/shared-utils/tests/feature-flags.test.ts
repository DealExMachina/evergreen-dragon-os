import { describe, it, expect, beforeEach } from 'vitest';
import {
  FeatureFlagManager,
  getFeatureFlagManager,
  setFeatureFlagManager,
  isFeatureEnabled,
} from '../src/feature-flags';
import type { FeatureFlag, FeatureFlagContext } from '../src/feature-flags';

describe('Feature Flags', () => {
  let manager: FeatureFlagManager;

  beforeEach(() => {
    manager = new FeatureFlagManager();
    setFeatureFlagManager(manager);
  });

  it('should register and check feature flags', () => {
    manager.register({
      key: 'test-feature',
      enabled: true,
    });

    expect(manager.isEnabled('test-feature')).toBe(true);
    expect(manager.isEnabled('non-existent')).toBe(false);
  });

  it('should respect enabled flag', () => {
    manager.register({
      key: 'disabled-feature',
      enabled: false,
    });

    expect(manager.isEnabled('disabled-feature')).toBe(false);
  });

  it('should handle rollout percentage', () => {
    manager.register({
      key: 'rollout-feature',
      enabled: true,
      rolloutPercentage: 50,
    });

    // Test multiple times to see distribution
    let enabledCount = 0;
    for (let i = 0; i < 100; i++) {
      if (manager.isEnabled('rollout-feature', { userId: `user-${i}` })) {
        enabledCount++;
      }
    }

    // Should be roughly 50% (allowing some variance)
    expect(enabledCount).toBeGreaterThan(30);
    expect(enabledCount).toBeLessThan(70);
  });

  it('should evaluate conditions', () => {
    manager.register({
      key: 'conditional-feature',
      enabled: true,
      conditions: [
        {
          field: 'environment',
          operator: 'equals',
          value: 'production',
        },
      ],
    });

    expect(
      manager.isEnabled('conditional-feature', { environment: 'production' })
    ).toBe(true);
    expect(manager.isEnabled('conditional-feature', { environment: 'dev' })).toBe(false);
    // When conditions exist but no context provided, should return false
    expect(manager.isEnabled('conditional-feature')).toBe(false);
    // When context provided but condition field missing, should return false
    expect(manager.isEnabled('conditional-feature', { userId: '123' })).toBe(false);
  });

  it('should handle multiple conditions', () => {
    manager.register({
      key: 'multi-conditional',
      enabled: true,
      conditions: [
        { field: 'environment', operator: 'equals', value: 'production' },
        { field: 'userId', operator: 'startsWith', value: 'admin-' },
      ],
    });

    expect(
      manager.isEnabled('multi-conditional', {
        environment: 'production',
        userId: 'admin-123',
      })
    ).toBe(true);

    expect(
      manager.isEnabled('multi-conditional', {
        environment: 'production',
        userId: 'user-123',
      })
    ).toBe(false);
  });

  it('should work with global functions', () => {
    manager.register({
      key: 'global-feature',
      enabled: true,
    });

    expect(isFeatureEnabled('global-feature')).toBe(true);
    expect(isFeatureEnabled('non-existent')).toBe(false);
  });
});

