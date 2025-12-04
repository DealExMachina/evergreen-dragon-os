import { getLogger } from './logger';

/**
 * Error context for logging
 */
export interface ErrorContext {
  operation: string;
  [key: string]: unknown;
}

/**
 * Executes an operation with error handling and logging
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: ErrorContext
): Promise<T> {
  const logger = getLogger();
  try {
    return await operation();
  } catch (error) {
    logger.error(`Failed to ${context.operation}`, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
    throw error;
  }
}

/**
 * Synchronous version of withErrorHandling
 */
export function withErrorHandlingSync<T>(
  operation: () => T,
  context: ErrorContext
): T {
  const logger = getLogger();
  try {
    return operation();
  } catch (error) {
    logger.error(`Failed to ${context.operation}`, {
      ...context,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
    throw error;
  }
}

/**
 * Handles async errors with context
 */
export function handleAsyncError(
  error: unknown,
  context: ErrorContext
): never {
  const logger = getLogger();
  logger.error(`Unhandled error in ${context.operation}`, {
    ...context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  });
  throw error instanceof Error ? error : new Error(String(error));
}

/**
 * Wraps a function with error handling
 */
export function wrapWithErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context: (args: Parameters<T>) => ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    // Check if function is async by checking if it returns a Promise
    const result = fn(...args);
    if (result instanceof Promise) {
      return withErrorHandling(
        () => result as Promise<ReturnType<T>>,
        context(args)
      );
    } else {
      return withErrorHandlingSync(
        () => result as ReturnType<T>,
        context(args)
      );
    }
  }) as T;
}

