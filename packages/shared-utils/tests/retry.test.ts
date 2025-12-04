import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { withRetry, retryable } from '../src/retry';
import { setLogger } from '../src/logger';
import { createMockLogger } from '@tests/utils';

describe('withRetry', () => {
  beforeEach(() => {
    // Set logger before any operation (respects architecture)
    setLogger(createMockLogger());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation);

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, { delay: 100 });

    // Fast-forward time to allow retry
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should exhaust retries and throw', async () => {
    const error = new Error('persistent error');
    const operation = vi.fn().mockRejectedValue(error);

    // Start the retry operation and immediately attach error handler
    const promise = withRetry(operation, { maxAttempts: 3, delay: 100 });

    // Attach catch handler immediately to prevent unhandled rejection
    promise.catch(() => {
      // Error will be handled by expect().rejects below
    });

    // Fast-forward through all retries
    // First attempt fails immediately, then retry after 100ms, then after 200ms
    await vi.advanceTimersByTimeAsync(100);
    await vi.advanceTimersByTimeAsync(200);

    // Wait for promise to settle (this handles the rejection properly)
    await expect(promise).rejects.toThrow('persistent error');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use exponential backoff', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'exponential',
    });

    // First retry after 100ms (2^0 * 100)
    await vi.advanceTimersByTimeAsync(100);
    // Second retry after 200ms (2^1 * 100)
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should use linear backoff', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, {
      maxAttempts: 3,
      delay: 100,
      backoff: 'linear',
    });

    // First retry after 100ms (1 * 100)
    await vi.advanceTimersByTimeAsync(100);
    // Second retry after 200ms (2 * 100)
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should respect shouldRetry callback', async () => {
    const retryableError = new Error('retryable');
    const nonRetryableError = new Error('non-retryable');
    const shouldRetry = vi.fn((error) => error === retryableError);

    const operation = vi.fn().mockRejectedValue(nonRetryableError);

    await expect(
      withRetry(operation, {
        maxAttempts: 3,
        shouldRetry,
      })
    ).rejects.toThrow('non-retryable');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledWith(nonRetryableError);
  });

  it('should call onRetry callback', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const onRetry = vi.fn();

    const promise = withRetry(operation, {
      delay: 100,
      onRetry,
    });

    await vi.advanceTimersByTimeAsync(100);
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
  });
});

describe('retryable', () => {
  it('should wrap function with retry logic', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce('success');

    const retryableFn = retryable(fn, { delay: 100 });

    vi.useFakeTimers();
    const promise = retryableFn('arg1', 'arg2');
    await vi.advanceTimersByTimeAsync(100);
    const result = await promise;
    vi.useRealTimers();

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});
