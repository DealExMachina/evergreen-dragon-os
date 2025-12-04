# Mastra Integrations Guide

⸻

## Overview

Mastra is fully integrated with all core services in Evergreen Dragon OS:

- **Supabase + Realtime**: Real-time event subscriptions and state synchronization
- **S3 Storage**: Document storage and DuckDB snapshots
- **mem0**: Institutional memory and entity graph
- **Temporal**: Workflow orchestration and execution
- **CopilotKit**: Bidirectional communication with AG-UI

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mastra Framework                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Commander│  │Simulation│  │  Other   │            │
│  │  Agent   │  │  Agent   │  │  Agents  │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
└───────┼──────────────┼──────────────┼──────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase   │ │     S3       │ │    mem0     │
│  Realtime   │ │   Storage    │ │  Integration│
└──────────────┘ └──────────────┘ └──────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Temporal    │ │ CopilotKit   │ │    RAG      │
│ Integration  │ │    Bridge    │ │   System    │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Supabase + Realtime Integration

**Location**: `apps/agents-service/src/mastra/integrations/supabase-realtime.ts`

### Features

- **Event Subscriptions**: Agents subscribe to `fund_events`, `assets`, and `fund_flows` tables
- **Automatic Routing**: Events are automatically routed to appropriate agents
- **State Synchronization**: Real-time state updates broadcast to all subscribers

### Usage

```typescript
const supabaseRealtime = new SupabaseRealtimeIntegration(config, mastra);

// Subscribe to fund events
supabaseRealtime.subscribeToEvents(async (payload) => {
  await supabaseRealtime.routeEventToAgent(
    payload.new.event_type,
    payload.new
  );
});

// Subscribe to asset changes
supabaseRealtime.subscribeToAssets(async (payload) => {
  // Handle asset updates
});
```

### Event Routing

Events are automatically routed to agents based on type:

- `ASSET_ONBOARD` → Simulation Agent
- `VALUATION_CYCLE` → Simulation Agent
- `MARKET_SHOCK` → Commander Agent
- `LIQUIDITY_STRESS` → Commander Agent
- `STRATEGIC_REQUEST` → Commander Agent
- `RISK_ALERT` → Commander Agent
- `COMPLIANCE_BREACH` → Commander Agent

## S3 Storage Integration

**Location**: `apps/agents-service/src/mastra/integrations/s3-storage.ts`

### Features

- **Document Storage**: Upload/download documents (KYC, appraisals, etc.)
- **DuckDB Snapshots**: Store and retrieve analytical database snapshots
- **Presigned URLs**: Generate secure URLs for AG-UI document access

### Configuration

Uses Supabase Storage (S3-compatible) or AWS S3:

```env
S3_ENDPOINT=https://<project>.supabase.co/storage/v1/s3
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=<supabase-storage-key>
S3_SECRET_ACCESS_KEY=<supabase-storage-secret>
S3_BUCKET=evergreen-documents
```

### Usage

```typescript
const s3Storage = new S3StorageIntegration(config, 'evergreen-documents');

// Upload document
await s3Storage.uploadDocument(
  'kyc/investor-123.pdf',
  documentBuffer,
  'application/pdf',
  { investorId: '123' }
);

// Upload DuckDB snapshot
await s3Storage.uploadDuckDBSnapshot('snapshot-2025-12-01', './analytics.duckdb');
```

## mem0 Integration

**Location**: `apps/agents-service/src/mastra/integrations/mem0-integration.ts`

### Features

- **Memory Search**: Query institutional memory for relevant context
- **Memory Storage**: Store agent decisions and outcomes
- **Context Augmentation**: Combine mem0 memories with RAG documents

### Usage

```typescript
const mem0 = new Mem0Integration(config, mastra);

// Search memories
const memories = await mem0.searchMemories(
  'liquidity stress test +200bps',
  10,
  ['scenario', 'crisis']
);

// Store agent decision
await mem0.storeAgentDecision(
  'commander',
  'NAV at risk under +150bps shock',
  'Increase liquid sleeve from 5% to 8%',
  'Liquidity improved by 3%',
  { nav: 100000000, liquidity: 5000000 }
);

// Get agent context (memories + RAG)
const context = await mem0.getAgentContext(
  'commander',
  'liquidity stress',
  true, // include memories
  true  // include RAG
);
```

## Temporal Integration

**Location**: `apps/agents-service/src/mastra/integrations/temporal-integration.ts`

### Features

- **Workflow Triggers**: Agents can start Temporal workflows
- **Status Monitoring**: Check workflow execution status
- **Signaling**: Send signals to running workflows

### Usage

```typescript
const temporal = new TemporalIntegration(config);
await temporal.initialize(config);

// Trigger asset unwind workflow
const workflowId = await temporal.triggerAssetUnwind(
  'asset-123',
  'Liquidity requirement'
);

// Trigger valuation cycle
await temporal.triggerValuationCycle('Q4', 2025);

// Trigger stress test
await temporal.triggerStressTest([
  { name: 'rate-shock-200bps', parameters: { rateChange: 0.02 } },
]);

// Check workflow status
const status = await temporal.getWorkflowStatus(workflowId);

// Signal workflow
await temporal.signalWorkflow(workflowId, 'approve', [true]);
```

## CopilotKit Bridge

**Location**: `apps/agents-service/src/mastra/integrations/copilotkit-bridge.ts`

### Features

- **Request Handling**: Process CopilotKit requests from AG-UI
- **State Synchronization**: Push agent state updates to UI
- **Bidirectional Communication**: Agents can update UI, UI can trigger agents

### Flow

1. User sends message via CopilotKit in AG-UI
2. Request forwarded to agents-service via Supabase Edge Function
3. CopilotKit bridge routes to Commander agent
4. Agent processes request and returns response
5. State updates pushed to Supabase for Realtime broadcast
6. AG-UI receives updates via Supabase Realtime subscription

### Usage

```typescript
const copilotKit = new CopilotKitBridge(mastra, supabaseRealtime);

// Handle CopilotKit request
const result = await copilotKit.handleCopilotRequest({
  message: 'Run next quarter valuation',
  context: { userId: 'user-123' },
  userId: 'user-123',
});

// Push state update
await copilotKit.pushStateUpdate('user-123', {
  nav: 100000000,
  liquidity: 5000000,
  status: 'valuation-running',
});

// Subscribe to user state changes
copilotKit.subscribeToUserState('user-123', (state) => {
  // Handle state update
});
```

## Integration Initialization

All integrations are initialized in `apps/agents-service/src/mastra/index.ts`:

```typescript
const integrationContext = await createMastra(config);

// Access integrations
integrationContext.supabaseRealtime.subscribeToEvents(...);
integrationContext.s3Storage.uploadDocument(...);
integrationContext.mem0.searchMemories(...);
integrationContext.temporal.triggerAssetUnwind(...);
integrationContext.copilotKit.handleCopilotRequest(...);
```

## Agent Access to Integrations

Agents receive integration context through Mastra:

```typescript
// In agent implementation
export class CommanderAgent extends BaseAgent {
  async process(input: {
    context?: MastraIntegrationContext;
    request?: string;
  }) {
    // Access integrations
    const mem0 = input.context?.mem0;
    const temporal = input.context?.temporal;
    const s3 = input.context?.s3Storage;

    // Use integrations
    const memories = await mem0?.searchMemories(input.request || '');
    const workflowId = await temporal?.triggerValuationCycle('Q4', 2025);
  }
}
```

## Configuration

All integrations use the shared config system:

```typescript
// packages/config/src/schema.ts
export const configSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    serviceKey: z.string(),
    // ...
  }),
  mem0: z.object({
    baseUrl: z.string().url(),
    apiKey: z.string(),
  }),
  temporal: z.object({
    address: z.string(),
    namespace: z.string(),
    taskQueue: z.string(),
  }),
  // ...
});
```

## Error Handling

All integrations include comprehensive error handling and logging:

- Failed operations are logged with context
- Retries for transient failures
- Graceful degradation when services unavailable

## Testing

Integration tests should verify:

- Supabase Realtime event routing
- S3 document upload/download
- mem0 memory storage/retrieval
- Temporal workflow triggers
- CopilotKit request/response flow

⸻

