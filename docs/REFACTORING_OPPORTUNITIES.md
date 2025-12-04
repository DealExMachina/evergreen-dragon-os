# Refactoring Opportunities & Code Quality Improvements

> Snapshot of structural improvements still on the table. Couple this backlog with the normative guidance in `docs/ENGINEERING_PRINCIPLES.md`.

---

## Status (December 2025)

| Theme | Status | Notes |
| --- | --- | --- |
| Unified service bootstrap (`ServiceRunner`) | ✅ | Every service starts/stops through the same lifecycle |
| Agent dependency injection | ✅ | `AgentContext` delivers config, clients, integrations |
| Integration contracts | ✅ | Supabase, Temporal, mem0, S3 implement typed interfaces |
| Event routing | ✅ | `config.agentRouting` replaces switch statements |
| Temporal activity context | ✅ | `withActivityContext` removes repeated `loadConfig()` |

---

## Active Backlog

### 1. Expand Interface Coverage (P1)
- **Why**: Analytics, notification, and compliance integrations still expose raw classes.
- **What**: Define `AnalyticsEngine`, `NotificationChannel`, `ComplianceAuditor` contracts in `mastra/integrations/contracts.ts` and make consumers depend on them.
- **Validation**: Add unit tests that mock interfaces to ensure agents never touch concrete implementations.

### 2. Observability Context Propagation (P1)
- **Why**: Langfuse hooks exist at logger level but traces/spans do not flow through workflows.
- **What**: Introduce an `ObservationContext` that attaches `traceId`, `spanId`, and Langfuse metadata to `AgentContext` and `withActivityContext`.
- **Validation**: Manual Langfuse smoke test confirming workflow spans share ancestry.

### 3. Configuration Snapshots (P2)
- **Why**: We resolve config on startup but do not persist it for audit or reproducibility.
- **What**: `ServiceRunner` should hash the resolved config + git SHA and insert into a `configs_applied` table each boot.
- **Validation**: Migration + hashing helper test; observe insert at startup.

### 4. DuckDB Connection Pooling (P2)
- **Why**: Scenario runner opens connections lazily without eviction, risking file-handle pressure.
- **What**: Extend `SingletonClientManager` with ref-counted DuckDB pools or a small LRU keyed by task queue.
- **Validation**: Stress script running concurrent simulations without exceeding configured pool size.

### 5. UI/Agent Contract Tests (P3)
- **Why**: CopilotKit bridge expects Commander responses with `{ actions, state }` but has no schema enforcement.
- **What**: Introduce schemas in `packages/shared-types` and pact-style tests between AG-UI and agents.
- **Validation**: Contract tests in CI verifying compatibility before deployment.

---

## Recently Completed (Holding Area)

| Item | Detail |
| --- | --- |
| Agent context injection | All Mastra agents use typed `AgentContext` instead of grabbing singletons |
| Integration contracts | `WorkflowScheduler`, `DocumentStorage`, `MemoryStore`, `EventRouter` implemented |
| Event routing config | `config.agentRouting` drives Supabase Realtime dispatch |
| HTTP client unification | Shared `HttpClient` + retries for mem0/external calls |
| Temporal activity context | `withActivityContext` memoizes config/clients for workflows |

---

## Working Agreement

1. Capture the opportunity here (≤10 lines) and point to the relevant principle.
2. Describe scope + validation briefly.
3. After implementation, move the entry to "Recently Completed" and expand details in `docs/REFACTORING_IMPLEMENTATION.md`.

_Last updated: 2025‑12‑04_

