import { Agent } from '@mastra/core';
import type { AgentContext } from '../../context/agent-context';
import { CommanderAgent } from '../../agents/commander';

/**
 * Mastra agent wrapper for Commander
 */
export function commanderAgent(context: AgentContext): Agent {
  const commander = new CommanderAgent(context);

  return {
    name: 'commander',
    instructions: `You are the Commander agent for Evergreen Dragon OS. 
    You provide strategic recommendations based on fund state, scenarios, and institutional memory.
    Always consider risk, compliance, and liquidity constraints in your recommendations.`,
    model: {
      provider: 'openai',
      name: 'gpt-4',
    },
    tools: [],
    // TODO: Add tools for Supabase queries, DuckDB scenarios, mem0 searches
    async execute(input: unknown) {
      return commander.process(input as { context?: string; request?: string });
    },
  };
}

