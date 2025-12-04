# Testing Infrastructure

This directory contains the shared testing infrastructure for the Evergreen Dragon OS project.

## Structure

```
tests/
├── setup.ts          # Global test setup and environment configuration
├── fixtures/         # Test data fixtures
│   └── index.ts      # Factory functions for creating test data
├── mocks/            # Mock implementations of external services
│   └── index.ts      # Mock factories for Prisma, Supabase, Mem0, etc.
└── utils/            # Test utility functions
    └── index.ts      # Helper functions for tests
```

## Usage

### In Your Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createMockConfig, createMockInvestor } from '../../../tests/fixtures';
import { createMockPrismaClient, mockFetch } from '../../../tests/mocks';
import { createTestContext } from '../../../tests/utils';

describe('MyComponent', () => {
  it('should work', () => {
    const config = createMockConfig();
    const investor = createMockInvestor();
    // ... test logic
  });
});
```

## Fixtures

Fixtures provide factory functions for creating test data:

- `createMockConfig()` - Creates a mock configuration object
- `createMockMemory()` - Creates a mock memory object
- `createMockEntity()` - Creates a mock entity object
- `createMockInvestor()` - Creates a mock investor
- `createMockAsset()` - Creates a mock asset
- `createMockEvent()` - Creates a mock event
- `createMockKYCDocument()` - Creates a mock KYC document

## Mocks

Mocks provide factory functions for creating mock implementations of external services:

- `createMockPrismaClient()` - Mock Prisma client
- `createMockSupabaseClient()` - Mock Supabase client
- `createMockMem0Client()` - Mock Mem0 client
- `createMockTemporalClient()` - Mock Temporal client
- `createMockDuckDBConnection()` - Mock DuckDB connection
- `mockFetch()` - Mock fetch API
- `mockFetchError()` - Mock fetch API with error

## Test Utilities

Utility functions for common test operations:

- `createTestContext()` - Creates a complete test context with all mocked dependencies
- `wait()` - Wait for a specified amount of time
- `delayedResolve()` - Create a promise that resolves after a delay
- `delayedReject()` - Create a promise that rejects after a delay
- `expectError()` - Assert that a function throws an error
- `createMockLogger()` - Create a mock logger

## Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run tests with coverage
pnpm test -- --coverage

# Run tests in watch mode
pnpm test -- --watch
```

## Best Practices

1. **Use fixtures** for creating test data instead of hardcoding values
2. **Use mocks** for external services to ensure tests are isolated
3. **Use test context** when you need multiple mocked dependencies
4. **Clean up** after tests using `beforeEach` and `afterEach` hooks
5. **Keep tests focused** - test one thing at a time
6. **Use descriptive test names** that explain what is being tested

## Example Test

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestContext } from '../../../tests/utils';
import { createMockInvestor } from '../../../tests/fixtures';
import { MyService } from '../src/my-service';

describe('MyService', () => {
  let context: ReturnType<typeof createTestContext>;
  let service: MyService;

  beforeEach(() => {
    context = createTestContext();
    service = new MyService(context.config, context.prisma);
  });

  it('should process investor', async () => {
    const investor = createMockInvestor();
    context.prisma.investor.findUnique.mockResolvedValue(investor);

    const result = await service.processInvestor(investor.id);

    expect(result).toBeDefined();
    expect(context.prisma.investor.findUnique).toHaveBeenCalledWith({
      where: { id: investor.id },
    });
  });
});
```

