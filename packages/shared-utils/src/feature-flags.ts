/**
 * Feature flag system for gradual rollouts and A/B testing
 */

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: FeatureFlagCondition[];
}

export interface FeatureFlagCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number;
}

export interface FeatureFlagContext {
  userId?: string;
  environment?: string;
  [key: string]: string | number | boolean | undefined;
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();

  /**
   * Registers a feature flag
   */
  register(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  /**
   * Registers multiple feature flags
   */
  registerMany(flags: FeatureFlag[]): void {
    for (const flag of flags) {
      this.register(flag);
    }
  }

  /**
   * Checks if a feature flag is enabled for the given context
   */
  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(key);
    if (!flag) {
      return false;
    }

    if (!flag.enabled) {
      return false;
    }

    // Check conditions - if conditions exist, context is required and all must pass
    if (flag.conditions && flag.conditions.length > 0) {
      // If conditions are defined, context is required
      if (!context) {
        return false;
      }
      for (const condition of flag.conditions) {
        const contextValue = context[condition.field];
        // If condition field is missing from context, condition fails
        if (contextValue === undefined) {
          return false;
        }

        if (!this.evaluateCondition(condition, contextValue)) {
          return false;
        }
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashContext(key, context);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Gets all registered feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Clears all feature flags
   */
  clear(): void {
    this.flags.clear();
  }

  private evaluateCondition(condition: FeatureFlagCondition, value: unknown): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'startsWith':
        return String(value).startsWith(String(condition.value));
      case 'endsWith':
        return String(value).endsWith(String(condition.value));
      case 'gt':
        return Number(value) > Number(condition.value);
      case 'lt':
        return Number(value) < Number(condition.value);
      case 'gte':
        return Number(value) >= Number(condition.value);
      case 'lte':
        return Number(value) <= Number(condition.value);
      default:
        return false;
    }
  }

  private hashContext(key: string, context?: FeatureFlagContext): number {
    const str = `${key}-${JSON.stringify(context || {})}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

let globalFeatureFlagManager: FeatureFlagManager = new FeatureFlagManager();

/**
 * Gets the global feature flag manager
 */
export function getFeatureFlagManager(): FeatureFlagManager {
  return globalFeatureFlagManager;
}

/**
 * Sets the global feature flag manager
 */
export function setFeatureFlagManager(manager: FeatureFlagManager): void {
  globalFeatureFlagManager = manager;
}

/**
 * Checks if a feature flag is enabled
 */
export function isFeatureEnabled(key: string, context?: FeatureFlagContext): boolean {
  return globalFeatureFlagManager.isEnabled(key, context);
}

