# Testing Implementation - Next Steps

## ✅ Completed

1. **Testing Strategy Document** (`tests/TESTING_STRATEGY.md`)
   - Aligned with architecture principles
   - Documents dependency injection patterns
   - Defines client manager testing approach
   - Provides test structure templates

2. **Test Infrastructure**
   - Global test setup (`tests/setup.ts`)
   - Test fixtures (`tests/fixtures/`)
   - Mock implementations (`tests/mocks/`)
   - Test utilities (`tests/utils/`)
   - Test helpers respecting architecture (`tests/utils/test-helpers.ts`)

3. **Unit Tests Created**
   - ✅ Config package: 14/14 tests passing
   - ✅ Shared-utils package: Core tests passing
   - ✅ Agent tests: BaseAgent, CommanderAgent
   - ✅ Activity tests: KYC, Stress Test

4. **Vitest Configuration**
   - Root-level config with path aliases
   - Package-specific configs
   - Proper setup files

## 🔧 Remaining Issues

### 1. Import Resolution (High Priority)
**Problem**: Some test files can't resolve `@evergreen/*` package imports in test-helpers.ts

**Status**: Fixed by using relative `require()` paths instead of package aliases

**Action**: Verify all tests pass after fix

### 2. Test Coverage Gaps
**Missing Tests For**:
- [ ] All agent implementations (Simulation, NAV, Liquidity, etc.)
- [ ] All activity implementations
- [ ] Temporal workflows
- [ ] Mastra integrations
- [ ] Supabase RPC functions
- [ ] DuckDB query builders
- [ ] Mem0 entity graph operations

### 3. Integration Tests (Future)
**Not Started**: Integration tests that test multiple components together
- Test with real test database
- Test with mock external services
- End-to-end workflow tests

## 📋 Immediate Next Steps

### Step 1: Verify All Tests Pass ✅
```bash
pnpm test
```
Ensure all unit tests pass after import resolution fix.

### Step 2: Expand Test Coverage
Priority order:
1. **Agent Tests** (High)
   - SimulationAgent
   - NAVOversightAgent
   - LiquidityEngineAgent
   - RebalancingAgent
   - UnwindAgent
   - KYCOnboardingAgent
   - RiskGuardianAgent
   - ComplianceSentinelAgent
   - CryptoBroAgent

2. **Activity Tests** (High)
   - All remaining activities in `workflows-service/src/activities/`

3. **Workflow Tests** (Medium)
   - Temporal workflow definitions
   - Workflow execution logic

4. **Integration Tests** (Medium)
   - Client manager integration
   - Service lifecycle
   - Error handling flows

### Step 3: Add Test Coverage Reporting
```bash
# Add to vitest config
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'dist/', 'tests/'],
}
```

### Step 4: CI/CD Integration
- Add test step to CI pipeline
- Set coverage thresholds
- Fail builds on test failures

## 🎯 Testing Goals

### Short Term (This Sprint)
- ✅ All existing code has unit tests
- ✅ Tests follow architecture patterns
- ✅ All tests passing
- ⏳ 80%+ code coverage on core packages

### Medium Term (Next Sprint)
- Integration tests for critical paths
- Performance/load tests for key operations
- E2E tests for main workflows

### Long Term
- Property-based testing for critical logic
- Chaos engineering tests
- Contract testing for external services

## 📚 Resources

- **Testing Strategy**: `tests/TESTING_STRATEGY.md`
- **Testing Guide**: `tests/TESTING_GUIDE.md`
- **Architecture**: `docs/ENGINEERING_PRINCIPLES.md`
- **Vitest Docs**: https://vitest.dev/

## 🔍 How to Add New Tests

1. **For Agents**:
   ```typescript
   import { setupTestEnvironmentSync } from '@tests/utils/test-helpers';
   
   describe('MyAgent', () => {
     let context: AgentContext;
     
     beforeEach(() => {
       const { context: testContext } = setupTestEnvironmentSync();
       context = testContext as AgentContext;
     });
     
     it('should process request', async () => {
       const agent = new MyAgent(context);
       // ... test
     });
   });
   ```

2. **For Activities**:
   ```typescript
   import { setupActivityTestEnvironmentSync } from '@tests/utils/test-helpers';
   
   beforeEach(() => {
     setupActivityTestEnvironmentSync();
   });
   ```

3. **For Utilities**:
   ```typescript
   import { createMockLogger } from '@tests/utils';
   import { setLogger } from '@evergreen/shared-utils';
   
   beforeEach(() => {
     setLogger(createMockLogger());
   });
   ```

## ⚠️ Common Pitfalls to Avoid

1. ❌ Don't call `loadConfig()` in tests - use `createMockConfig()`
2. ❌ Don't access global singletons directly - use dependency injection
3. ❌ Don't make real network/DB calls - mock at boundaries
4. ❌ Don't share state between tests - reset in `beforeEach`
5. ❌ Don't test implementation details - test behavior

