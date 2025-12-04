import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CommanderAgent } from '../../src/agents/commander';
import type { AgentContext } from '../../src/context/agent-context';
import { setupTestEnvironmentSync, cleanupTestEnvironmentSync } from '../../../../tests/utils/test-helpers';

describe('CommanderAgent', () => {
  let context: AgentContext;
  let agent: CommanderAgent;

  beforeEach(() => {
    // Use architecture-respecting test setup
    const { context: testContext } = setupTestEnvironmentSync();
    context = testContext as AgentContext;
    agent = new CommanderAgent(context);
  });

  afterEach(() => {
    cleanupTestEnvironmentSync();
  });

  it('should have correct name', () => {
    expect(agent.getName()).toBe('Commander');
  });

  it('should process requests and return recommendations', async () => {
    const input = {
      context: 'Test context',
      request: 'What should we do?',
    };

    const result = await agent.process(input);

    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('situationalAwareness');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toHaveProperty('action');
    expect(result.recommendations[0]).toHaveProperty('priority');
    expect(result.recommendations[0]).toHaveProperty('reasoning');
  });

  it('should return situational awareness', async () => {
    const awareness = await agent.getSituationalAwareness();

    expect(awareness).toHaveProperty('assets');
    expect(awareness).toHaveProperty('nav');
    expect(awareness).toHaveProperty('liquidity');
    expect(awareness).toHaveProperty('pendingFlows');
    expect(typeof awareness.assets).toBe('number');
    expect(typeof awareness.nav).toBe('number');
    expect(typeof awareness.liquidity).toBe('number');
    expect(typeof awareness.pendingFlows).toBe('number');
  });

  it('should log processing', async () => {
    const logger = createMockLogger();
    context.logger = logger;

    const agent = new CommanderAgent(context);
    await agent.process({ request: 'test' });

    expect(logger.info).toHaveBeenCalledWith(
      'Commander processing request',
      expect.any(Object)
    );
  });
});

