import type { Config } from '@evergreen/config';
import { getLogger, type Logger } from './logger';
import { withErrorHandling } from './error-handling';

/**
 * Base interface for all integrations
 */
export interface Integration {
  /**
   * Initialize the integration with configuration
   */
  initialize(config: Config): Promise<void>;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Check if integration is initialized
   */
  isInitialized(): boolean;
}

/**
 * Abstract base class for integrations
 * Provides common initialization and cleanup patterns
 */
export abstract class BaseIntegration implements Integration {
  protected config: Config | null = null;
  protected logger: Logger = getLogger();
  protected initialized = false;

  /**
   * Initialize the integration
   */
  async initialize(config: Config): Promise<void> {
    if (this.initialized) {
      this.logger.warn(`${this.constructor.name} already initialized`);
      return;
    }

    await withErrorHandling(
      async () => {
        this.config = config;
        await this.doInitialize(config);
        this.initialized = true;
        this.logger.info(`${this.constructor.name} initialized`);
      },
      { operation: `initialize ${this.constructor.name}` }
    );
  }

  /**
   * Cleanup the integration
   */
  async cleanup(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    await withErrorHandling(
      async () => {
        await this.doCleanup();
        this.initialized = false;
        this.logger.info(`${this.constructor.name} cleaned up`);
      },
      { operation: `cleanup ${this.constructor.name}` }
    );
  }

  /**
   * Check if integration is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the configuration (throws if not initialized)
   */
  protected getConfig(): Config {
    if (!this.config) {
      throw new Error(`${this.constructor.name} not initialized. Call initialize() first.`);
    }
    return this.config;
  }

  /**
   * Subclasses implement this to perform actual initialization
   */
  protected abstract doInitialize(config: Config): Promise<void>;

  /**
   * Subclasses implement this to perform actual cleanup
   */
  protected abstract doCleanup(): Promise<void>;
}

