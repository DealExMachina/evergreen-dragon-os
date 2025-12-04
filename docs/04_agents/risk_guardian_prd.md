# Risk Guardian Agent PRD

⸻

## Mission

Continuously monitor Evergreen Dragon OS for market, liquidity, leverage, and operational risks, turning Langfuse telemetry and Supabase data into actionable alerts for Commander and Compliance Sentinel.

## Responsibilities

- Track VaR, stress losses, liquidity ladder utilization, and ESG breaches in near real time.
- Correlate agent actions (Simulation, Liquidity Engine, Rebalancing, CryptoBro) with Langfuse traces to detect anomalous reasoning or looping behaviors.
- Emit structured `RISK_ALERT` events (see `docs/03_event_system.md`).
- Propose mitigations (increase liquid sleeve, delay deployments, trigger secondary sales) and escalate to Commander.

## Inputs

- Supabase queries (`asset_snapshots`, `liquidity_ladder`, `fund_flows`, `portfolio_allocations`).
- DuckDB scenario outputs (`valuation_runs`, `liquidity_risk_tree`).
- Langfuse traces (`events.*`, `agents.*`, `data.*` spans) with anomaly scores.
- Infisical-configured thresholds (VaR limit, max leverage, ESG banding).
- Commander plan metadata (expected draws, exposures).

## Outputs

- `RISK_ALERT` and `DATA_DRIFT` events with correlation IDs.
- Updates to `fund_events` and `audit_trail`.
- Optional Temporal signals to pause workflows (`AssetUnwindWorkflow`, `TokenizedLiquidityWorkflow`) when risk exceeds limits.
- Dashboards/notifications via AG-UI (Tailwind alert bars).

## Architecture Hooks

- Runs inside `agents-service` as Mastra node, subscribed to Supabase Realtime and Langfuse webhooks.
- Uses `packages/shared-utils/events` to publish alerts.
- Stores findings in mem0 (`RiskIncident` nodes) for future Commander reasoning.

## Temporal & Event Interactions

| Trigger | Action |
| --- | --- |
| `MARKET_SHOCK` event | Launches `StressTestWorkflow`, monitors results, potentially emits alert |
| Liquidity ladder breach (`liquidity_ladder.utilization >= capacity * threshold`) | Emit `LIQUIDITY_STRESS` and recommended mitigation |
| DuckDB vs Supabase NAV delta > tolerance | Emit `DATA_DRIFT` and request Simulation rerun |

## Guardrails

- Never mutates Supabase tables directly; uses RPCs.
- Alerts must include `langfuse_trace_id` and `severity`.
- Infisical policy `risk.guardian.json` defines thresholds, updated via change control.

## KPIs

- Mean time to detect (MTTD) vs actual event time.
- Percentage of alerts resolved within SLA.
- False-positive rate per alert type.
- Coverage of Langfuse traces (≥ 98% of agent executions monitored).

⸻

