import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withErrorHandling,
  withErrorHandlingSync,
  handleAsyncError,
  wrapWithErrorHandling,
} from '../src/error-handling';
import { setLogger } from '../src/logger';
import { createMockLogger } from '@tests/utils';

describe('withErrorHandling', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    // Set logger before any operation (respects architecture)
    logger = createMockLogger();
    setLogger(logger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return result on success', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withErrorHandling(operation, { operation: 'test' });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should log and rethrow error on failure', async () => {
    const error = new Error('test error');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      withErrorHandling(operation, { operation: 'test operation' })
    ).rejects.toThrow('test error');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to test operation',
      expect.objectContaining({
        operation: 'test operation',
        error: expect.objectContaining({
          name: 'Error',
          message: 'test error',
        }),
      })
    );
  });

  it('should include context in error log', async () => {
    const error = new Error('test error');
    const operation = vi.fn().mockRejectedValue(error);

    await expect(
      withErrorHandling(operation, {
        operation: 'test',
        userId: '123',
        resourceId: '456',
      })
    ).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to test',
      expect.objectContaining({
        operation: 'test',
        userId: '123',
        resourceId: '456',
      })
    );
  });
});

describe('withErrorHandlingSync', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    setLogger(logger);
  });

  it('should return result on success', () => {
    const operation = vi.fn().mockReturnValue('success');

    const result = withErrorHandlingSync(operation, { operation: 'test' });

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should log and rethrow error on failure', () => {
    const error = new Error('test error');
    const operation = vi.fn().mockImplementation(() => {
      throw error;
    });

    expect(() => withErrorHandlingSync(operation, { operation: 'test' })).toThrow('test error');

    expect(operation).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('handleAsyncError', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    setLogger(logger);
  });

  it('should log and throw error', () => {
    const error = new Error('test error');

    expect(() => handleAsyncError(error, { operation: 'test' })).toThrow('test error');

    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled error in test',
      expect.objectContaining({
        operation: 'test',
        error: expect.objectContaining({
          name: 'Error',
          message: 'test error',
        }),
      })
    );
  });

  it('should convert non-Error to Error', () => {
    expect(() => handleAsyncError('string error', { operation: 'test' })).toThrow();

    expect(logger.error).toHaveBeenCalled();
  });
});

describe('wrapWithErrorHandling', () => {
  let logger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    logger = createMockLogger();
    setLogger(logger);
  });

  it('should wrap async function', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const wrapped = wrapWithErrorHandling(fn, () => ({ operation: 'test' }));

    const result = await wrapped('arg1', 'arg2');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should wrap sync function', () => {
    const fn = vi.fn().mockReturnValue('success');
    const wrapped = wrapWithErrorHandling(fn, () => ({ operation: 'test' }));

    const result = wrapped('arg1', 'arg2');

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should handle errors in wrapped function', async () => {
    const error = new Error('test error');
    const fn = vi.fn().mockRejectedValue(error);
    const wrapped = wrapWithErrorHandling(fn, (args) => ({
      operation: 'test',
      args: args.join(','),
    }));

    await expect(wrapped('arg1')).rejects.toThrow('test error');

    expect(logger.error).toHaveBeenCalled();
  });
});

