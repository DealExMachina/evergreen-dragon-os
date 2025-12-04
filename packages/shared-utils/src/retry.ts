import { getLogger } from './logger';

/**
 * Retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay based on attempt and backoff strategy
 */
function calculateDelay(attempt: number, baseDelay: number, backoff: 'linear' | 'exponential'): number {
  if (backoff === 'exponential') {
    return baseDelay * Math.pow(2, attempt - 1);
  }
  return baseDelay * attempt;
}

/**
 * Retries an operation with configurable options
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const logger = getLogger();
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (opts.shouldRetry && !opts.shouldRetry(error)) {
        logger.debug('Error not retryable', { error, attempt });
        throw error;
      }

      // If this is the last attempt, throw
      if (attempt >= opts.maxAttempts) {
        logger.warn('Max retry attempts reached', { attempts: attempt, error });
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts.delay, opts.backoff);
      logger.debug('Retrying operation', { attempt, maxAttempts: opts.maxAttempts, delay });

      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Creates a retryable function wrapper
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

