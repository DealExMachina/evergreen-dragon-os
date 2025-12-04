# Mastra Integration Guide

⸻

## Overview

Evergreen Dragon OS uses **Mastra** as the agent orchestration framework. Mastra provides:
- Agent management and execution
- RAG (Retrieval-Augmented Generation) for document context
- MCP (Model Context Protocol) integration for external tools
- Workflow orchestration capabilities

## Package Versions (December 2025)

- `@mastra/core`: ^0.24.6 (verified on npm)
- `@mastra/react`: ^0.0.21 (verified on npm)
- `@mastra/rag`: ^1.3.6 (verified on npm)
- `@mastra/mcp`: ^0.14.4 (verified on npm)

## Architecture

```
apps/agents-service/
├─ src/
│  ├─ mastra/
│  │  ├─ index.ts              # Main Mastra instance creation
│  │  ├─ agents/               # Mastra agent wrappers
│  │  │  ├─ commander.ts       # Commander agent
│  │  │  └─ simulation.ts      # Simulation agent
│  │  ├─ mcp-setup.ts          # MCP client configuration
│  │  ├─ rag-setup.ts          # RAG system setup
│  │  ├─ tools/                # Custom Mastra tools
│  │  └─ workflows/            # Mastra workflows
│  ├─ agents/                  # Agent implementations
│  │  ├─ commander.ts          # CommanderAgent class
│  │  └─ simulation.ts         # SimulationAgent class
│  └─ index.ts                 # Service entry point
```

## Agent Registration

Agents are registered with Mastra in `src/mastra/index.ts`:

```typescript
const mastra = new Mastra({
  name: 'evergreen-dragon-os',
  agents: [
    commanderAgent(config),
    simulationAgent(config),
  ],
  tools: mcpTools,  // From MCP clients
  rag: rag,         // RAG system for document retrieval
});
```

## MCP Integration

MCP (Model Context Protocol) connects agents to external tools:
- Document servers (for KYC, appraisals, etc.)
- Pricing feeds
- Regulatory data sources

Configuration in `packages/config`:
```typescript
mcp: {
  endpoints: string[],  // MCP server URLs
  timeout: number,      // Request timeout
}
```

## RAG Integration

RAG (Retrieval-Augmented Generation) provides document context:
- Stores embeddings in vector database (Supabase pgvector)
- Retrieves relevant context for agent reasoning
- Used by Commander for historical pattern matching

## Adding New Agents

1. Create agent class in `src/agents/`
2. Create Mastra wrapper in `src/mastra/agents/`
3. Register in `src/mastra/index.ts`

Example:
```typescript
// src/mastra/agents/new-agent.ts
export function newAgent(config: Config): Agent {
  const agent = new NewAgent(config);
  return {
    name: 'new-agent',
    instructions: '...',
    model: { provider: 'openai', name: 'gpt-4' },
    tools: [],
    async execute(input) {
      return agent.process(input);
    },
  };
}
```

## Tools

Tools can be:
- MCP tools (from external MCP servers)
- Custom Mastra tools (defined in `src/mastra/tools/`)

Tools are registered with Mastra and available to all agents.

## Workflows

Mastra workflows can be defined in `src/mastra/workflows/` for complex multi-step agent operations.

## Configuration

Mastra configuration is part of the main config system:
- Agent models configured via `config.mcp` for MCP endpoints
- RAG vector store configured via Supabase connection
- Tools loaded from MCP clients

## Usage in Agents

Agents can:
- Access RAG for document retrieval
- Use MCP tools for external operations
- Call other agents through Mastra's agent mesh
- Execute workflows for complex operations

## Integrations

Mastra is fully integrated with all core services:
- **Supabase + Realtime**: Real-time event subscriptions and state synchronization
- **S3 Storage**: Document storage and DuckDB snapshots
- **mem0**: Institutional memory and entity graph
- **Temporal**: Workflow orchestration and execution
- **CopilotKit**: Bidirectional communication with AG-UI

For detailed integration documentation, see [MASTRA_INTEGRATIONS.md](MASTRA_INTEGRATIONS.md).

⸻

