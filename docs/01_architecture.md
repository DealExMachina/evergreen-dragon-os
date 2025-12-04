# Technical Architecture

⸻

## System Architecture

```text
                            AG-UI (Next.js + CopilotKit)
          Tailwind CSS • Transparent Dashboards • Chat | Voice | Actions
                                      ▲
                                      │
                           Supabase Realtime + RPC
                                      │
     ┌──────────────────────┬─────────┴───────────┬─────────────────────┐
     │                      │                     │                     │
     ▼                      ▼                     ▼                     ▼
Temporal Workflows   Mastra Agent Mesh     Supabase (ODS)         DuckDB Engine
 Long-lived WFs       Commander +          Assets | Flows         Valuations |
 Asset Unwind         Specialists          NAV | Events           Stress Sims |
 Valuations           (Simulation, NAV,     Compliance             ESG Models
 KYC                  Liquidity, Rebal, Unwind, KYC, CryptoBro)
     ▲                      │                     ▲                     │
     │                      │                     │                     │
     └─────────────── Shared Context & Config (TypeScript packages) ─────┘

                   mem0 Institutional Memory + Entity Graph
                     (Scenarios, Playbooks, Preferences)
                                      ▲
                                      │
                         Langfuse Observability & Tracing
```

The platform is intentionally modular: Temporal guarantees durability and auditability for multi-step operations, Mastra handles agent reasoning and orchestration, Supabase acts as the operational data store and realtime bus, DuckDB powers analytical simulations, and mem0 anchors institutional memory. CopilotKit keeps the UI synchronized with agent states and lets humans issue commands directly into the workflow graph, while Langfuse traces every agent step so Risk Guardian and Compliance Sentinel can intervene. Pulumi provisions the underlying cloud estate and Infisical distributes secrets to each component without hardcoding credentials.

---

## Data Architecture

## Supabase – Operational Truth

Supabase hosts the transactional schema with row-level security and realtime triggers. Key tables (non-exhaustive):

- `assets`, `asset_snapshots`
- `fund_flows`, `subscriptions`, `redemptions`
- `portfolio_allocations`, `liquidity_ladder`
- `fund_events` (typed: ASSET_ONBOARD, MARKET_SHOCK, etc.)
- `investors_pending_kyc`, `compliance_logs`, `audit_trail`
- `workflow_runs` (Temporal metadata mirrored for querying)

Supabase roles:

- **service_role:** internal Temporal/agent access for full read/write, stored as secret.
- **edge_role:** AG-UI authenticated clients with RLS policies tied to LP/PM scopes.
- **replication_role:** optional analytics export into DuckDB or long-term archival.

Realtime broadcasts propagate table changes to the Agent mesh. RPC functions (SQL + plpgsql) encapsulate sensitive mutations so front-end calls stay minimal.

## DuckDB – Simulation + OLAP

DuckDB runs embedded within the Simulation Agent containers (or via serverless DuckDB-WASM for read-only). It stores:

- scenario parameter sets (yield curves, credit shocks, ESG factors)
- valuation models and cached outputs
- liquidity risk trees and waterfall calculations
- secondaries pricing curves and tokenized liquidity AMM states

Agents spin up DuckDB connections per request and always push summarized results back into Supabase plus mem0 narratives. A periodic “snapshot to object storage” job captures DuckDB state for reproducibility.

## mem0 – Institutional Memory

mem0 maintains a typed entity graph:

- nodes: Assets, Investors, Scenarios, Playbooks, Crises, Decisions, Preferences
- edges: “experienced”, “resolved-with”, “owned-by”, “contradicts”
- payload: concise natural-language memories, embedding vectors for retrieval, metadata (timestamp, confidence, author)

Agents write mem0 entries after each major workflow stage (Temporal hooks) and read context before reasoning. Commander uses mem0 to provide continuity (“What worked last time we had +150bps shock?”).

---

## Agent Layer (Mastra)

All agents are orchestrated through **Mastra framework** with:
- **RAG integration** for document retrieval and context augmentation
- **MCP integration** for external tools (documents, pricing, regulatory data)
- **Agent mesh** for inter-agent communication

| Agent | Core Responsibilities | Inputs | Outputs | Temporal Hooks | mem0 Usage |
| --- | --- | --- | --- | --- | --- |
| Simulation | DuckDB valuations, stress tests, liquidity trees | Supabase state, market data | valuation snapshots, risk metrics | `StressTestWorkflow`, `QuarterlyValuationWorkflow` | store scenario summaries |
| NAV Oversight | NAV validation, stale data detection, MCP document pulls | Supabase NAV snapshots, admin docs via MCP | NAV discrepancy alerts, MCP digests | `QuarterlyValuationWorkflow` | log narratives on NAV disputes |
| Liquidity Engine | Liquidity ladder, ELTIF redemption logic, gating | fund_flows, liquidity ladder, shocks | redemption queues, gating actions | `LiquidityCrisisWorkflow` | remember gating precedents |
| Rebalancing | Adjust allocations, throttle deployments | allocations, strategy constraints | rebalance proposals, Temporal commands | `RebalanceWorkflow` | capture successful playbooks |
| Unwind | Sell illiquid assets, coordinate bids | asset metadata, market bids | haircut calc, settlement tasks | `AssetUnwindWorkflow` | capture counterparties + lessons |
| KYC/Onboarding | AML, eligibility, doc extraction via RAG/MCP | investor docs, OCR outputs, MCP document servers | approval/denial, data enrichment | `KycWorkflow` | store recurring issues |
| Risk Guardian | Monitor agent operations, VaR limits, scenario breaches | Supabase metrics, DuckDB outputs, Langfuse traces | risk alerts, escalation events | subscribed to all workflows | store breach narratives |
| Compliance Sentinel | Enforce ELTIF/AIFMD/MiCA policies, audit workflows | mem0 policies, Infisical configs, workflow logs | approvals/denials, breach reports | gating steps within sensitive workflows | capture regulator feedback |
| CryptoBro (MiCA) | Tokenized liquidity sleeves, AMM sims, chain ops with compliance | liquidity gaps, MiCA config, on-chain data | tokenized patch proposals | `TokenizedLiquidityWorkflow` | track regulatory approvals/denials |
| Commander | Strategic planner, PM copilot | mem0, Supabase, DuckDB, RAG context, MCP tools, agent telemetry, risk/compliance alerts | recommendations, workflow triggers | orchestrates others | reads/writes every major event |

Agents share a TypeScript SDK for:

- typed Supabase queries (Prisma)
- DuckDB adapters
- Temporal workflow clients
- mem0 client
- Mastra agent framework
- RAG document retrieval
- MCP tool integration
- configuration schema (Zod)

---

## Temporal Workflows (Temporal.io)

1. **AssetUnwindWorkflow**
   - Steps: solicit bids → wait for responses → evaluate haircuts → schedule settlement → update Supabase NAV/Liquidity → write mem0 summary.
   - Retry policies for each external call, compensating transactions to revert partial settlements.

2. **QuarterlyValuationWorkflow**
   - Fetch appraisals via MCP → OCR + KPI extraction → Simulation Agent valuations → NAV Oversight comparison with admin NAV → publish results → mem0 narrative.

3. **StressTestWorkflow**
   - Triggered by MARKET_SHOCK or manual command → run >50 DuckDB scenarios → aggregate exposures → Commander briefing.

4. **KycWorkflow**
   - Multi-step approvals (AML, eligibility, ERISA) with manual checkpoints and SLA timers.

5. **TokenizedLiquidityWorkflow**
   - CryptoBro proposals → compliance review → MiCA guardrails → blockchain execution → Supabase/Mem0 updates.

Each workflow emits events into `fund_events` and pushes structured logs to mem0 for long-term reasoning. Temporal visibility APIs feed AG-UI timeline widgets.

---

## Event System & Simulation Loop

Event taxonomy (all stored in Supabase `fund_events` with payload JSON schemas):

- `ASSET_ONBOARD`, `VALUATION_CYCLE`, `MARKET_SHOCK`, `LIQUIDITY_STRESS`, `REBALANCE`, `STRATEGIC_REQUEST`, `UNWIND_ASSET`, `TOKENIZED_LIQUIDITY_INJECTION`, `RISK_ALERT`, `COMPLIANCE_BREACH`.

Supabase Realtime channels broadcast these events. Agent subscribers react as follows:

1. Supabase insert → Commander plus Risk Guardian and Compliance Sentinel ingest via Realtime.
2. Commander decides whether to trigger Temporal workflow or call peer agent through Mastra agent mesh, factoring in risk/compliance signals.
3. Agent executes, updates Supabase, and appends mem0 summary; Risk/Compliance agents observe Langfuse traces for anomalies.
4. AG-UI receives updated state (via CopilotKit) and refreshes dashboards, providing natural-language explanations and alert banners.

Simulation loop: periodic cron-like Temporal schedule (e.g., hourly) launching micro-scenarios (P&L drift, liquidity ladder delta, ESG compliance). Deviations beyond thresholds raise STRATEGIC_REQUEST events for Commander review.

---

## Use Cases & Demo Flow

1. **Onboard new Data Center asset**
   - KYC & asset intake workflows run.
   - Simulation Agent produces base valuation.
   - Commander summarizes effect on allocation; AG-UI shows timeline.

2. **Run next quarter**
   - QuarterlyValuationWorkflow executes end-to-end.
   - NAV Oversight Agent flags discrepancies; mem0 logs rationale.

3. **Apply +200bps shock**
   - StressTestWorkflow recomputes exposures.
   - Liquidity Engine detects shortfall, suggests gating/tokenized patch.
   - Commander offers multi-step plan.

4. **Execute plan**
   - Rebalancing + Unwind workflows run with Temporal reliability.
   - Supabase state + mem0 narrative updated, AG-UI confirms completion.

5. **CryptoBro intervention**
   - TokenizedLiquidityWorkflow proposes MiCA-compliant sleeve.
   - Compliance agent approves/denies; Commander communicates to PM.

---

## Positioning for Boutique Fund Managers

- **Digital Twin Operations:** Always-on simulations and agents replicate the fund’s behavior, making regulatory reviews proactive instead of reactive.
- **MiCA & ELTIF Ready:** Separation of concerns (Supabase for ops, DuckDB for analytics, Temporal for workflows) yields clean audit surfaces and MiCA-friendly tokenized liquidity traces.
- **Composable Stack:** pnpm monorepo with shared packages, typed config, Dockerized services—easy to extend for new jurisdictions or asset classes.
- **Human + AI Collaboration:** Commander + AG-UI keep PMs in control with narrative explanations, mem0-backed reasoning, and action buttons tied to Temporal workflows.
- **Transparent UX + Monitoring:** Tailwind CSS ensures clarity for PMs/LPS, while Langfuse + Risk Guardian + Compliance Sentinel provide live trust indicators.

---

## Infrastructure, Secrets, and Monitoring

- **Pulumi IaC:** All cloud assets (Temporal namespaces, Supabase projects, Langfuse, networking, container registries) are authored in Pulumi TypeScript stacks, enabling reproducible, reviewable deployments per environment.
- **Infisical Secret Management:** Services authenticate to Infisical with scoped machine identities; `packages/config` pulls encrypted secrets (Supabase keys, mem0 API tokens, MCP credentials) at runtime before injecting them into agents/workflows.
- **Langfuse Observability:** Each agent call and Temporal activity emits Langfuse traces/metrics. Risk Guardian and Compliance Sentinel subscribe to these traces to flag anomalous reasoning paths or compliance breaches.
- **Tailwind CSS Design System:** AG-UI leans on Tailwind + transparency-first components to surface alerts, risk/compliance banners, and Langfuse telemetry overlays without overwhelming PMs.

---
