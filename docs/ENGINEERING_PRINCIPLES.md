# Engineering Principles

Guiding conventions for EverGreen Dragon OS. Each principle is enforced in code (see `docs/REFACTORING_IMPLEMENTATION.md`) and must be followed for any new module.

## 1. Services Run Through `ServiceRunner`
- Entry points (`apps/agents-service`, `apps/workflows-service`) boot via `ServiceRunner`, which loads config, wires logging, and installs signal handlers.
- New services must expose a `ServiceLifecycle` implementation and pass it to `ServiceRunner` to guarantee identical startup and shutdown semantics.

## 2. Dependency Injection via `AgentContext` & Activity Context
- Agents receive a typed `AgentContext` that carries config, logger, data clients, and integration contracts. No agent may hydrate global singletons directly.
- Temporal activities call `withActivityContext(...)` to obtain memoized config, Prisma, mem0, and logger instances. Avoid calling `loadConfig()` inside activity functions.

## 3. Integration Contracts
- Mastra integrations implement contracts in `apps/agents-service/src/mastra/integrations/contracts.ts` (`WorkflowScheduler`, `DocumentStorage`, `MemoryStore`, `EventRouter`).
- Agents depend on interfaces, not concrete classes. Swapping storage or workflow backends only requires providing another implementation.

## 4. Routing & Configuration
- Event → agent routing belongs to config (`config.agentRouting`). Runtime logic (`SupabaseRealtimeIntegration`) reads this map instead of hard-coding dispatch tables.
- Extend routing by editing configuration, not source files.

## 5. Logging & Error Handling
- All asynchronous boundaries wrap operations with `withErrorHandling`, ensuring structured logs (`message`, `context`, serialized `error`).
- External I/O must go through the shared `HttpClient` (which layers retry/backoff) or SDKs wrapped with `withErrorHandling`.

## 6. Client & Resource Lifecycle
- Long-lived clients (Prisma, mem0, DuckDB) are managed through `SingletonClientManager`. Never instantiate these clients ad hoc.
- Integrations extend `BaseIntegration` (which itself extends `AbstractService`) to align initialization/cleanup semantics.

## 7. Documentation Hygiene
- Architectural guidance lives here. `docs/REFACTORING_OPPORTUNITIES.md` tracks deltas against these principles, while `docs/REFACTORING_IMPLEMENTATION.md` captures applied changes.
- When adding a new pattern, update this document first, then reference it from other docs or pull requests.

