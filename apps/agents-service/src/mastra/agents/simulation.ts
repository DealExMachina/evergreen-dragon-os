import { Agent } from '@mastra/core';
import type { AgentContext } from '../../context/agent-context';
import { SimulationAgent } from '../../agents/simulation';

/**
 * Mastra agent wrapper for Simulation
 */
export function simulationAgent(context: AgentContext): Agent {
  const simulation = new SimulationAgent(context);

  return {
    name: 'simulation',
    instructions: `You are the Simulation agent for Evergreen Dragon OS.
    You run valuation scenarios and stress tests using DuckDB.
    You output structured results that feed into NAV calculations and risk assessments.`,
    model: {
      provider: 'openai',
      name: 'gpt-4',
    },
    tools: [],
    // TODO: Add tools for DuckDB queries, scenario execution
    async execute(input: unknown) {
      return simulation.process(input as {
        scenarioName: string;
        parameters: Record<string, number>;
        assetIds?: string[];
      });
    },
  };
}

