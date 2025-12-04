# Evergreen Dragon OS

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://github.com/DealExMachina/evergreen-dragon-os)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-orange.svg)](https://pnpm.io/)

Research project exploring AI-native architectures for evergreen and ELTIF 2.0 fund management. Full-stack operating system enabling boutique managers to operate at institutional scale through autonomous agent orchestration, durable workflows, and continuous simulation.

## Problem

Evergreen funds must reconcile continuous subscriptions/redemptions with illiquid assets, precise valuations, and multi-layer regulatory regimes (ELTIF, AIFMD, MiCA, SFDR) using boutique-sized teams. Legacy tooling fragments operations into siloed spreadsheets and opaque service providers, making real-time response and compliance proof impossible.

## Solution

Digital twin of fund operations. Every asset, cashflow, and regulatory constraint lifted into an agentic environment that simulates, monitors, and orchestrates continuously. Agents reason across Supabase operational truth, DuckDB analytics, mem0 institutional memory, and Temporal workflows.

```mermaid
graph TB
    subgraph "Research Focus"
        A[AI-First Fund Management] --> B[Autonomous Operations]
        A --> C[Continuous Simulation]
        A --> D[Institutional Memory]
    end
```

## Architecture

Modular full-stack: Temporal for durable workflows, Mastra for agent orchestration, Supabase for operational data, DuckDB for analytics, mem0 for knowledge graphs.

```mermaid
graph LR
    UI[AG-UI<br/>Next.js + CopilotKit] -->|Realtime| SB[(Supabase)]

    CMD[Commander] --> SIM[Simulation]
    CMD --> NAV[NAV]
    CMD --> LIQ[Liquidity]
    CMD --> KYC[KYC]
    CMD --> CRYPTO[CryptoBro]

    SIM --> DB[(DuckDB)]
    SIM --> SB
    NAV --> SB
    LIQ --> SB
    KYC --> SB
    CRYPTO --> SB

    CMD --> MEM[mem0]
    TEMP[Temporal] --> SB
    TEMP --> MEM
```

## Design Choices

**Dependency Injection**: Typed `AgentContext`, no global singletons. Activities use `withActivityContext()`.

**Event-Driven**: Supabase Realtime triggers agent responses. Routing via `config.agentRouting`.

**Type Safety**: Strict TypeScript, Zod validation, Prisma types.

**Observability**: Langfuse traces, structured logging, Temporal visibility.

```mermaid
graph TD
    A[Event] -->|Realtime| B[Event Router]
    B --> C[Commander]
    C --> D{Temporal?}
    D -->|Yes| E[Workflow]
    D -->|No| F[Agent]
    E --> G[Update Supabase]
    F --> G
    G --> H[mem0]
    H --> I[Langfuse]
```

## Tech Stack

Node.js 20+, TypeScript 5.9, Temporal.io, Mastra, Supabase, DuckDB, mem0, Langfuse, Next.js, CopilotKit, Zod 4.x, Prisma, Pulumi.

## Getting Started

```bash
pnpm install
pnpm --filter @evergreen/supabase-client prisma generate
pnpm test
pnpm dev
```

See [docs/infra_setup.md](docs/infra_setup.md) for infrastructure.

## Documentation

- [Overview](docs/00_overview.md) - Executive narrative
- [Architecture](docs/01_architecture.md) - System design
- [Data Model](docs/02_data_model.md) - Schemas
- [Event System](docs/03_event_system.md) - Event-driven architecture
- [Agent PRDs](docs/04_agents/) - Agent specifications
- [Engineering Principles](docs/ENGINEERING_PRINCIPLES.md) - Guidelines
- [Testing Strategy](tests/TESTING_STRATEGY.md) - Test patterns

## Contributing

Fork, create branch, ensure pre-commit hooks pass, submit PR. `main` branch protected. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT - see [LICENSE](LICENSE).

## Acknowledgments

Temporal, Mastra, Supabase, DuckDB, mem0, Langfuse, CopilotKit, Next.js, Prisma, Zod, Pulumi.

## Organization

[DealExMachina](https://github.com/DealExMachina)

---

**Status**: Research project v0.0.1. Not production-ready.
