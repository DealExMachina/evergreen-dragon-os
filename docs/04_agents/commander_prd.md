# Commander Agent – Product Requirements Document

⸻

## Mission

Provide the Portfolio Manager (PM) with a continuously updated, AI-native strategic copilot that synthesizes Supabase state, DuckDB simulations, mem0 institutional memory, and peer-agent telemetry to recommend, trigger, and explain fund-level actions.

## Objectives

1. Maintain global situational awareness (NAV drift, liquidity posture, compliance status, investor pipeline).
2. Generate prioritized strategic recommendations with rationale, confidence, and expected impact.
3. Coordinate execution by invoking peer agents or launching Temporal workflows with the correct parameters and guardrails.
4. Communicate with humans through AG-UI chat/voice, including mem0-grounded explanations and “what-if” simulations.

## Inputs

- Supabase snapshots via typed SDK (assets, flows, liquidity ladder, compliance logs, fund_events).
- DuckDB scenario outputs (valuation grids, stress results, liquidity risk trees).
- mem0 memories (playbooks, past crises, PM preferences, ESG reasoning).
- Agent telemetry (status heartbeats, queued tasks, completion summaries).
- External signals through MCP servers (documents, pricing feeds).
- Langfuse span/trace metadata for every agent invocation, including anomaly scores and latency outliers.

## Outputs

- Strategic recommendation objects (`recommendation_id`, `type`, `priority`, `actions[]`, `confidence`).
- Temporal workflow triggers (e.g., `StressTestWorkflow`, `AssetUnwindWorkflow`, `TokenizedLiquidityWorkflow`).
- AG-UI messages (chat responses, dashboard annotations, voice prompts).
- mem0 entries summarizing rationale and PM feedback.
- Alerts to Risk Guardian and Compliance Sentinel when a plan carries elevated exposure or regulatory implications.

## Capabilities

1. **Situation Assessment:** Merge Supabase + DuckDB + mem0 context into a normalized state vector updated every N minutes or on event.
2. **Multi-Step Reasoning:** Use Mastra agent workflows to evaluate constraints (ELTIF, MiCA, liquidity gates) before issuing recommendations.
3. **Plan Compilation:** Output step-by-step plans referencing peer agents (Simulation, Liquidity, Rebalancing, etc.) plus expected metrics.
4. **Human Override Loop:** Present decisions to PM, accept structured approval/decline, and log reasoning to mem0.
5. **Narrative Generation:** Translate system state into natural-language briefings referencing historic patterns from mem0.

## Guardrails

- All actions require policy checks (Zod schema + TypeScript guard functions) verifying inputs, compliance tags, and SLAs.
- Tokenized liquidity proposals must route through Compliance Agent before invoking CryptoBro.
- Critical workflows (asset unwind, gating) require PM acknowledgment captured via AG-UI.
- Commander cannot directly mutate Supabase data; it must act through RPCs, agents, or Temporal workflows.
- Risk Guardian and Compliance Sentinel receive a Langfuse trace link for each recommendation; Commander blocks auto-execution if either agent flags a breach.

## Temporal Touchpoints

- Orchestrator for `StressTestWorkflow`, `QuarterlyValuationWorkflow`, `AssetUnwindWorkflow`, `KycWorkflow`, `TokenizedLiquidityWorkflow`.
- Subscribes to Temporal `WorkflowCompleted` signals to update mem0 and inform AG-UI.
- Schedules periodic “health pings” to ensure agents are online; triggers fallback automation if heartbeats fail.
- Emits `RISK_ALERT` and `COMPLIANCE_BREACH` events into Supabase when Risk Guardian/Compliance Sentinel raise issues, ensuring Temporal event histories stay auditable.

## mem0 Usage

- Prior to reasoning: fetch top-N memories related to current scenario (e.g., “NAV shock”, “liquidity shortfall”).
- Post decision: store structured memory (`{situation, action, outcome, human_feedback}`) for future retrieval.
- Tag preferences (“PM dislikes leverage >1.3x”, “ESG downgrades require board review”) to enforce soft constraints.
- Record outcomes of Risk/Compliance escalations so future action plans are preemptively shaped by what regulators previously accepted.

## AG-UI / CopilotKit Integration

- Exposes chat endpoints for natural-language queries (“What happens if we pull 5% from liquid sleeve?”).
- Provides quick actions that map to Temporal workflow invocations with prefilled parameters.
- Streams progress updates as workflows execute, using CopilotKit state synchronization.
- Displays Langfuse-derived risk/compliance badges so PMs can gauge agent confidence before approving.

---

## Agent Roster & Specifications

## Simulation Agent

- **Purpose:** Execute valuation logic, stress tests, liquidity tree calculations using DuckDB and market data feeds.
- **Key Inputs:** Supabase state, scenario configs, market shocks, ESG parameters.
- **Outputs:** Valuation snapshots, scenario delta tables, risk flags.
- **Temporal Hooks:** Core worker for `QuarterlyValuationWorkflow`, `StressTestWorkflow`.
- **mem0:** Logs scenario narratives and accuracy metrics.

## NAV Oversight Agent

- **Purpose:** Validate NAV consistency vs admin numbers, detect stale inputs, cross-check documents via MCP.
- **Inputs:** Supabase NAV tables, admin files, Simulation Agent output.
- **Outputs:** Discrepancy alerts, “NAV confidence” scores, suggested remediation.
- **Temporal Hooks:** Runs post-simulation in `QuarterlyValuationWorkflow`.
- **mem0:** Records why discrepancies occurred and which fixes worked.

## Liquidity Engine Agent

- **Purpose:** Maintain liquidity ladder, enforce ELTIF redemption rules, propose gating queues.
- **Inputs:** fund_flows, liquidity ladder, shock events, redemption requests.
- **Outputs:** Redemption throttles, gating plans, shortfall alerts, tokenized liquidity requests (to CryptoBro).
- **Temporal Hooks:** `LiquidityCrisisWorkflow`, triggered by `LIQUIDITY_STRESS`.
- **mem0:** Stores gating precedents and LP communications.

## Rebalancing Agent

- **Purpose:** Reallocate exposures across sleeves, throttle deployment, schedule capital calls.
- **Inputs:** portfolio_allocations, target strategy templates, Commander instructions.
- **Outputs:** Rebalance proposals, execution orders, expected NAV deltas.
- **Temporal Hooks:** `RebalanceWorkflow`, `RunQuarterWorkflow`.
- **mem0:** Captures success metrics of each rebalance for future heuristics.

## Unwind Agent

- **Purpose:** Sell private assets, negotiate secondary discounts, coordinate settlement tasks.
- **Inputs:** asset metadata, bid requests/responses, liquidity requirements.
- **Outputs:** Haircut calculations, settlement instructions, liquidity contributions.
- **Temporal Hooks:** Sole executor for `AssetUnwindWorkflow`.
- **mem0:** Logs counterparties, outcomes, and compliance notes.

## KYC/Onboarding Agent

- **Purpose:** Automate AML, eligibility, ERISA checks, document extraction.
- **Inputs:** Investor documents, OCR outputs, sanction lists.
- **Outputs:** Approval/denial decisions, enriched investor profiles, audit logs.
- **Temporal Hooks:** `KycWorkflow` with manual approval steps.
- **mem0:** Tracks recurring document issues and regulators’ feedback.

## CryptoBro Agent (MiCA Tokenized Liquidity)

- **Purpose:** Model and execute MiCA-compliant tokenized money market funds or green bond sleeves to patch liquidity gaps.
- **Inputs:** Liquidity Engine requests, on-chain quotes (BASE/Polygon/Celo), MiCA policy config, compliance approvals.
- **Outputs:** Tokenized liquidity proposals, AMM simulations, blockchain transaction receipts.
- **Temporal Hooks:** `TokenizedLiquidityWorkflow` (proposal → compliance → execution).
- **mem0:** Saves each tokenization case, regulatory responses, chain telemetry.
- **Tone:** Friendly but governed—UI copy can include playful flavor (“Yo fam…”) yet all actions stay within MiCA guardrails.

## Risk Guardian Agent

- **Purpose:** Observe all agent operations to detect Value-at-Risk breaches, liquidity shortfalls, or anomalous agent reasoning.
- **Inputs:** Langfuse traces, Supabase telemetry, DuckDB stress thresholds, Commander plans.
- **Outputs:** `RISK_ALERT` events, mitigation playbooks, dynamic guardrails for Commander.
- **Temporal Hooks:** Passive subscriptions across workflows; can pause workflows via Temporal signals when critical thresholds trip.
- **mem0:** Stores context on past incidents and mitigation efficacy.

## Compliance Sentinel Agent

- **Purpose:** Enforce ELTIF/AIFMD/MiCA policies, track KYC/AML completeness, and approve sensitive actions.
- **Inputs:** Proposed actions, regulatory rule sets sourced from Infisical, mem0 policy memories, Temporal audit logs.
- **Outputs:** Approvals/denials with reasoning, breach reports, updated policy diffs.
- **Temporal Hooks:** Gatekeeper steps across KYC, Tokenized Liquidity, Asset Unwind, and capital call workflows.
- **mem0:** Records regulator responses, providing precedent for future Commander decisions.

---

## Inter-Agent Communication

- **Mastra Agent Mesh:** Agents are registered with Mastra framework; Commander orchestrates through Mastra's agent execution model. Agents communicate via typed contracts and shared context packages.
- **Supabase Event Bus:** Agents publish/subscribe to `fund_events`; Commander orchestrates based on event taxonomy.
- **Shared Packages:** `@evergreen/config`, `@evergreen/supabase`, `@evergreen/mem0`, `@evergreen/temporal-client`.
- **Langfuse + Infisical:** Langfuse streams structured telemetry to Risk Guardian/Compliance Sentinel, while Infisical distributes encrypted policy/secrets referenced by all agents.

---

## KPIs & Telemetry

- Recommendation adoption rate (how many Commander suggestions executed).
- Time-to-detect for liquidity/NAV anomalies.
- Workflow SLA adherence (Temporal metrics).
- mem0 recall precision (percentage of relevant memories per scenario).
- LP/PM satisfaction (qualitative feedback captured via AG-UI).
- Risk/compliance breach MTTR (time from Langfuse alert to Commander mitigation).

---

## Roadmap Iterations

1. **v0.1** – Commander basic situational awareness, manual approval loop, Simulation/NAV/Liquidity agents wired.
2. **v0.2** – Full Temporal orchestration, KYC automation, mem0 entity graph integration.
3. **v0.3** – CryptoBro + MiCA workflows, AG-UI voice interface, DuckDB scenario marketplace.
4. **v1.0** – Production readiness: SOC2 controls, disaster recovery playbooks, LP portal exposure.

⸻
