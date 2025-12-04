import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BaseAgent } from '../../src/base/agent';
import type { AgentContext } from '../../src/context/agent-context';
import { setupTestEnvironmentSync, cleanupTestEnvironmentSync } from '../../../../tests/utils/test-helpers';

class TestAgent extends BaseAgent {
  getName(): string {
    return 'TestAgent';
  }

  async process(input: unknown): Promise<unknown> {
    return { processed: input };
  }
}

describe('BaseAgent', () => {
  let context: AgentContext;
  let agent: TestAgent;

  beforeEach(() => {
    // Use architecture-respecting test setup
    const { context: testContext } = setupTestEnvironmentSync();
    context = testContext as AgentContext;
    agent = new TestAgent(context);
  });

  afterEach(() => {
    cleanupTestEnvironmentSync();
  });

  it('should initialize with context', () => {
    expect(agent.getName()).toBe('TestAgent');
  });

  it('should have access to config', () => {
    expect((agent as any).config).toBe(context.config);
  });

  it('should have access to logger', () => {
    expect((agent as any).logger).toBe(context.logger);
  });

  it('should have access to prisma', () => {
    expect((agent as any).prisma).toBe(context.prisma);
  });

  it('should have access to mem0', () => {
    expect((agent as any).mem0).toBe(context.mem0);
  });

  it('should have access to integrations', () => {
    expect((agent as any).integrations).toBe(context.integrations);
  });

  it('should process input', async () => {
    const input = { test: 'data' };
    const result = await agent.process(input);

    expect(result).toEqual({ processed: input });
  });
});

