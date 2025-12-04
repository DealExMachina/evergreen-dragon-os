# Testing Strategy

This document defines the testing strategy for Evergreen Dragon OS, aligned with our architecture principles.

## Core Principles

### 1. Respect Dependency Injection
- **Agents**: Test with `AgentContext` containing mocked dependencies
- **Activities**: Test with `withActivityContext()` providing mocked context
- **Never**: Directly access global singletons in tests
- **Always**: Pass dependencies through constructor/context

### 2. Client Manager Pattern
- **Use**: `setClient()` and `reset()` methods on client managers for testing
- **Reset**: All client managers in `beforeEach` to ensure test isolation
- **Mock**: Clients at the manager level, not at the factory level

### 3. Logger Management
- **Set**: Logger using `setLogger()` before any operation that might log
- **Mock**: Logger in `beforeEach` for each test suite
- **Verify**: Log calls through the mock, not console output

### 4. Configuration
- **Use**: `createMockConfig()` from fixtures, never call `loadConfig()` in tests
- **Pass**: Config directly to components under test
- **Isolate**: Each test should have its own config instance

### 5. External Service Boundaries
- **Mock**: All external services (DBs, APIs, Temporal, etc.) at the boundary
- **Never**: Make real network calls or DB connections in unit tests
- **Verify**: Interactions through mocks, not side effects

## Test Structure

### Test Setup Pattern
```typescript
describe('Component', () => {
  let config: Config;
  let logger: Logger;
  let context: TestContext;

  beforeEach(() => {
    // 1. Create mock config
    config = createMockConfig();
    
    // 2. Create and set mock logger
    logger = createMockLogger();
    setLogger(logger);
    
    // 3. Reset all client managers
    resetPrismaClient();
    resetMem0Client();
    // ... reset other managers
    
    // 4. Create test context with mocks
    context = createTestContext({ config });
  });

  afterEach(() => {
    // Cleanup: reset all managers
    resetPrismaClient();
    resetMem0Client();
    // ... reset other managers
  });
});
```

### Testing Agents
```typescript
it('should process request', async () => {
  // Arrange: Set up mocks in context
  context.prisma.investor.findUnique.mockResolvedValue(mockInvestor);
  context.mem0.searchMemories.mockResolvedValue([]);
  
  // Act: Create agent with context
  const agent = new CommanderAgent(context);
  const result = await agent.process({ request: 'test' });
  
  // Assert: Verify behavior
  expect(result).toBeDefined();
  expect(context.prisma.investor.findUnique).toHaveBeenCalled();
});
```

### Testing Activities
```typescript
it('should extract documents', async () => {
  // Arrange: Mock dependencies
  const mockLogger = createMockLogger();
  setLogger(mockLogger);
  
  // Act: Call activity function
  const result = await extractDocuments([mockDocument]);
  
  // Assert: Verify result
  expect(result.extracted).toHaveLength(1);
});
```

### Testing Client Managers
```typescript
it('should manage client lifecycle', () => {
  const manager = new SingletonClientManager(factory);
  const mockClient = createMockClient();
  
  // Test: Set client
  manager.setClient(mockClient);
  expect(manager.getClient()).toBe(mockClient);
  
  // Test: Reset
  manager.reset();
  expect(manager.isInitialized()).toBe(false);
});
```

## Test Categories

### Unit Tests
- **Scope**: Single function/class in isolation
- **Dependencies**: All mocked
- **Speed**: Fast (< 100ms per test)
- **Location**: `packages/*/tests/`, `apps/*/tests/`

### Integration Tests (Future)
- **Scope**: Multiple components working together
- **Dependencies**: Real services (DBs, APIs) in test environment
- **Speed**: Slower (seconds)
- **Location**: `tests/integration/`

## Mock Strategy

### What to Mock
1. **External Services**: Supabase, Mem0, DuckDB, Temporal
2. **Network Calls**: HTTP requests via `mockFetch()`
3. **File System**: Use temp directories, mock fs operations
4. **Time**: Use `vi.useFakeTimers()` for time-dependent tests

### What NOT to Mock
1. **Business Logic**: Test actual implementation
2. **Internal Utilities**: Test real error handling, retry logic
3. **Type System**: Let TypeScript catch type errors

## Common Patterns

### Testing Async Operations
```typescript
it('should handle async operation', async () => {
  const operation = vi.fn().mockResolvedValue('result');
  const result = await withRetry(operation);
  expect(result).toBe('result');
});
```

### Testing Error Handling
```typescript
it('should handle errors', async () => {
  const logger = createMockLogger();
  setLogger(logger);
  
  const operation = vi.fn().mockRejectedValue(new Error('test'));
  await expect(withErrorHandling(operation, { operation: 'test' }))
    .rejects.toThrow('test');
  
  expect(logger.error).toHaveBeenCalled();
});
```

### Testing Retry Logic
```typescript
it('should retry on failure', async () => {
  vi.useFakeTimers();
  const logger = createMockLogger();
  setLogger(logger);
  
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

## Test Organization

```
tests/
├── setup.ts              # Global setup (env vars, mocks)
├── fixtures/             # Test data factories
├── mocks/                # Mock implementations
└── utils/                # Test utilities

packages/*/tests/         # Package-specific unit tests
apps/*/tests/             # App-specific unit tests
```

## Best Practices

1. **Isolation**: Each test is independent, no shared state
2. **Clarity**: Test names describe what is being tested
3. **Coverage**: Test happy paths, error cases, edge cases
4. **Speed**: Keep tests fast, mock slow operations
5. **Maintainability**: Use fixtures and utilities, avoid duplication

## Anti-Patterns to Avoid

❌ **Don't**: Call `loadConfig()` in tests
✅ **Do**: Use `createMockConfig()` and pass directly

❌ **Don't**: Access global singletons directly
✅ **Do**: Use dependency injection through context

❌ **Don't**: Make real network/DB calls
✅ **Do**: Mock at the boundary

❌ **Don't**: Test implementation details
✅ **Do**: Test behavior and contracts

❌ **Don't**: Share state between tests
✅ **Do**: Reset everything in `beforeEach`

