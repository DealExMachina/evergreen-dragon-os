import type { Config } from '@evergreen/config';
import { loadConfig } from '@evergreen/config';
import { createLogger, setLogger, getLogger } from './logger';
import { withErrorHandling } from './error-handling';

/**
 * Service lifecycle interface
 * All services should implement this for consistent startup/shutdown
 */
export interface ServiceLifecycle {
  /**
   * Initialize the service with configuration
   */
  initialize(config: Config): Promise<void>;

  /**
   * Start the service (after initialization)
   */
  start(): Promise<void>;

  /**
   * Cleanup resources before shutdown
   */
  cleanup(): Promise<void>;

  /**
   * Get service name for logging
   */
  getName(): string;
}

/**
 * Service runner that handles common lifecycle patterns
 */
export class ServiceRunner {
  constructor(private service: ServiceLifecycle) {}

  /**
   * Runs the service with proper initialization, signal handling, and cleanup
   */
  async run(): Promise<void> {
    const config = await loadConfig();
    const logger = createLogger(config);
    setLogger(logger);

    const serviceName = this.service.getName();
    logger.info(`Starting ${serviceName}`, { environment: config.environment });

    try {
      // Initialize service
      await withErrorHandling(
        () => this.service.initialize(config),
        { operation: `initialize ${serviceName}` }
      );

      // Start service
      await withErrorHandling(
        () => this.service.start(),
        { operation: `start ${serviceName}` }
      );

      logger.info(`${serviceName} started successfully`);

      // Setup graceful shutdown handlers
      this.setupShutdownHandlers(serviceName);
    } catch (error) {
      const logger = getLogger();
      logger.error(`Failed to start ${serviceName}`, error);
      await this.service.cleanup().catch((cleanupError) => {
        logger.error(`Failed to cleanup ${serviceName} after startup failure`, cleanupError);
      });
      process.exit(1);
    }
  }

  /**
   * Sets up SIGINT and SIGTERM handlers for graceful shutdown
   */
  private setupShutdownHandlers(serviceName: string): void {
    const shutdown = async (signal: string) => {
      const logger = getLogger();
      logger.info(`Received ${signal}, shutting down ${serviceName} gracefully`);

      try {
        await withErrorHandling(
          () => this.service.cleanup(),
          { operation: `cleanup ${serviceName}` }
        );
        logger.info(`${serviceName} shutdown complete`);
        process.exit(0);
      } catch (error) {
        logger.error(`Error during ${serviceName} shutdown`, error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

