# Testing Guide

This document provides a comprehensive guide to the testing infrastructure for the Evergreen Dragon OS project.

## Overview

The project uses **Vitest** as the testing framework. All external services (databases, APIs, etc.) are mocked to ensure tests run in isolation without requiring actual connections.

## Test Structure

```
evergreen-dragon-os/
├── tests/                          # Shared test infrastructure
│   ├── setup.ts                   # Global test setup
│   ├── fixtures/                  # Test data factories
│   ├── mocks/                     # Mock implementations
│   └── utils/                     # Test utilities
├── packages/
│   └── */tests/                   # Package-specific tests
└── apps/
    └── */tests/                   # App-specific tests
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Unit Tests Only
```bash
pnpm test:unit
```

### With Coverage
```bash
pnpm test -- --coverage
```

### Watch Mode
```bash
pnpm test -- --watch
```

### Specific Package/App
```bash
cd packages/shared-utils && pnpm test
cd apps/agents-service && pnpm test
```

## Test Infrastructure

### Fixtures (`tests/fixtures/`)

Fixtures provide factory functions for creating test data:

```typescript
import { createMockConfig, createMockInvestor } from '../../../tests/fixtures';

const config = createMockConfig({ environment: 'test' });
const investor = createMockInvestor({ name: 'John Doe' });
```

Available fixtures:
- `createMockConfig()` - Configuration object
- `createMockMemory()` - Mem0 memory object
- `createMockEntity()` - Entity graph object
- `createMockInvestor()` - Investor data
- `createMockAsset()` - Asset data
- `createMockEvent()` - Event data
- `createMockKYCDocument()` - KYC document

### Mocks (`tests/mocks/`)

Mocks provide factory functions for external services:

```typescript
import { createMockPrismaClient, mockFetch } from '../../../tests/mocks';

const prisma = createMockPrismaClient();
prisma.investor.findUnique.mockResolvedValue(investor);

mockFetch({ data: 'response' });
```

Available mocks:
- `createMockPrismaClient()` - Prisma database client
- `createMockSupabaseClient()` - Supabase client
- `createMockMem0Client()` - Mem0 client
- `createMockTemporalClient()` - Temporal workflow client
- `createMockDuckDBConnection()` - DuckDB connection
- `mockFetch()` - HTTP fetch mock
- `mockFetchError()` - HTTP fetch error mock

### Test Utilities (`tests/utils/`)

Utility functions for common test operations:

```typescript
import { createTestContext, wait, expectError } from '../../../tests/utils';

const context = createTestContext();
await wait(100); // Wait 100ms
await expectError(async () => { throw new Error('test'); }, 'test');
```

Available utilities:
- `createTestContext()` - Complete test context with all mocks
- `wait()` - Wait for specified time
- `delayedResolve()` - Promise that resolves after delay
- `delayedReject()` - Promise that rejects after delay
- `expectError()` - Assert function throws error
- `createMockLogger()` - Mock logger

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyService } from '../src/my-service';
import { createTestContext } from '../../../../tests/utils';
import { createMockInvestor } from '../../../../tests/fixtures';

describe('MyService', () => {
  let context: ReturnType<typeof createTestContext>;
  let service: MyService;

  beforeEach(() => {
    context = createTestContext();
    service = new MyService(context.config, context.prisma);
  });

  it('should do something', async () => {
    const investor = createMockInvestor();
    context.prisma.investor.findUnique.mockResolvedValue(investor);

    const result = await service.process(investor.id);

    expect(result).toBeDefined();
  });
});
```

### Testing Async Operations

```typescript
it('should handle async operations', async () => {
  const promise = service.asyncOperation();
  
  // Wait for operation
  await wait(100);
  
  const result = await promise;
  expect(result).toBeDefined();
});
```

### Testing Errors

```typescript
it('should throw error on invalid input', async () => {
  await expectError(
    async () => service.process(null),
    'Invalid input'
  );
});
```

### Mocking External Services

```typescript
it('should call external service', async () => {
  const mockClient = createMockMem0Client();
  mockClient.createMemory.mockResolvedValue({ id: 'mem-123' });

  const service = new MyService(mockClient);
  await service.createMemory('content');

  expect(mockClient.createMemory).toHaveBeenCalledWith('content');
});
```

## Test Coverage

The project aims for high test coverage. Run with coverage to see current status:

```bash
pnpm test -- --coverage
```

Coverage reports are generated in:
- `coverage/` directory (HTML report)
- `coverage/lcov.info` (LCOV format)

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocks**: Always mock external services (DBs, APIs, etc.)
3. **Fixtures**: Use fixtures instead of hardcoding test data
4. **Descriptive Names**: Test names should clearly describe what is being tested
5. **Arrange-Act-Assert**: Structure tests with clear sections
6. **Cleanup**: Use `beforeEach`/`afterEach` to set up and clean up test state
7. **Fast Tests**: Keep tests fast by avoiding real I/O operations

## Common Patterns

### Testing with Prisma

```typescript
it('should query database', async () => {
  const investor = createMockInvestor();
  context.prisma.investor.findUnique.mockResolvedValue(investor);

  const result = await service.getInvestor('investor-123');

  expect(result).toEqual(investor);
  expect(context.prisma.investor.findUnique).toHaveBeenCalledWith({
    where: { id: 'investor-123' },
  });
});
```

### Testing HTTP Clients

```typescript
it('should make HTTP request', async () => {
  mockFetch({ data: 'response' });

  const result = await httpClient.get('/endpoint');

  expect(result).toEqual({ data: 'response' });
  expect(global.fetch).toHaveBeenCalled();
});
```

### Testing Retry Logic

```typescript
it('should retry on failure', async () => {
  vi.useFakeTimers();
  
  const operation = vi
    .fn()
    .mockRejectedValueOnce(new Error('fail'))
    .mockResolvedValueOnce('success');

  const promise = withRetry(operation, { delay: 100 });
  await vi.advanceTimersByTimeAsync(100);
  const result = await promise;

  expect(result).toBe('success');
  expect(operation).toHaveBeenCalledTimes(2);
  
  vi.useRealTimers();
});
```

## Troubleshooting

### Tests Failing Due to Module Resolution

If you see module resolution errors, check:
1. `tsconfig.json` paths are correctly configured
2. Vitest config has correct alias mappings
3. Import paths use correct relative paths

### Mock Not Working

1. Ensure mocks are imported before the module being tested
2. Check that `vi.mock()` is called at the top level
3. Verify mock implementation matches the expected interface

### Async Test Timeouts

1. Increase timeout: `it('test', async () => { ... }, { timeout: 10000 })`
2. Check for unhandled promises
3. Ensure all async operations are awaited

## Continuous Integration

Tests should pass in CI/CD pipelines. Ensure:
- All environment variables are set in CI
- Test database connections are mocked (not used)
- Coverage thresholds are met
- All tests pass before merging

