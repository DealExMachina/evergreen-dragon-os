# Event System & Temporal Trigger Catalog

⸻

## Objectives

- Provide a single canonical list of domain events with typed payloads.
- Describe producers, consumers, and Temporal workflows tied to each event.
- Define routing (Supabase Realtime channels, MCP webhooks, Langfuse traces).
- Document governance (retention, auditing, replay strategy).

---

## Event Bus Overview

- Events stored in Supabase table `fund_events`.
- Columns: `event_id (uuid)`, `type (text)`, `payload (jsonb)`, `source (enum)`, `workflow_id (text)`, `created_at`, `ingested_by`.
- Realtime channel: `realtime:fund_events` with filters per type.
- Commander, Risk Guardian, Compliance Sentinel subscribe via Supabase Realtime and push spans to Langfuse with `event_id`.

Payload schema conventions:

```json
{
  "asset_id": "uuid?",
  "investor_id": "uuid?",
  "workflow_id": "string?",
  "metrics": { "key": "value" },
  "notes": "string",
  "attachments": ["url"]
}
```

Every payload must include `context.correlation_id` for cross-service tracing.

---

## Event Catalog

| Type | Description | Producer(s) | Consumer(s) | Temporal Workflow |
| --- | --- | --- | --- | --- |
| `ASSET_ONBOARD` | New asset onboarding begun/completed | KYC Agent, Ops portal | Commander, Simulation, Compliance Sentinel | `AssetOnboardWorkflow` |
| `VALUATION_CYCLE` | Trigger for periodic valuations | Scheduler, Commander | Simulation, NAV Oversight, mem0 writer | `QuarterlyValuationWorkflow` |
| `MARKET_SHOCK` | External shock (rates, FX, ESG) | Market feed listener, Human PM | Commander, Simulation, Risk Guardian | `StressTestWorkflow` |
| `LIQUIDITY_STRESS` | Liquidity ladder breach | Liquidity Engine, Risk Guardian | Commander, Rebalancing, CryptoBro | `LiquidityCrisisWorkflow` |
| `REBALANCE` | Instruction to rebalance exposures | Commander, Human PM | Rebalancing Agent, Compliance Sentinel | `RebalanceWorkflow` |
| `STRATEGIC_REQUEST` | PM request for analysis/plan | AG-UI, Commander | Simulation, NAV Oversight, mem0 | Commander orchestrated |
| `UNWIND_ASSET` | Request to unwind illiquid asset | Commander, Liquidity Engine | Unwind Agent, Compliance Sentinel | `AssetUnwindWorkflow` |
| `TOKENIZED_LIQUIDITY_INJECTION` | MiCA tokenization action | CryptoBro Agent | Compliance Sentinel, Liquidity Engine | `TokenizedLiquidityWorkflow` |
| `RISK_ALERT` | VaR/limit breach detection | Risk Guardian | Commander, Compliance Sentinel, AG-UI | None (manual / auto-check) |
| `COMPLIANCE_BREACH` | Policy violation | Compliance Sentinel | Commander, Ops, mem0 | `ComplianceRemediationWorkflow` |
| `DATA_DRIFT` | Data quality issue (valuation mismatch) | Postgres trigger | Commander, Simulation, Ops | `DataRemediationWorkflow` |
| `KYC_STATUS_CHANGE` | Investor status update | KYC Agent | Commander, Liquidity Engine, Compliance Sentinel | `KycWorkflow` continuation |
| `WORKFLOW_COMPLETED` | Temporal completion mirror | Temporal bridge worker | Commander, mem0, AG-UI | n/a (notification) |

---

## Payload Definitions (Selected)

### ASSET_ONBOARD

```json
{
  "asset_id": "uuid",
  "stage": "init|due_diligence|approved|rejected",
  "sponsor": "string",
  "target_size": 15000000,
  "documents": ["https://.../im.pdf"]
}
```

- Producer: KYC/Onboarding Agent.
- Consumers: Commander (update allocations), Simulation Agent (seed valuations), mem0 (store narrative).

### LIQUIDITY_STRESS

```json
{
  "asset_id": "uuid?",
  "liquidity_gap": 4200000,
  "trigger": "redemption|shock|scenario",
  "ladder_snapshot": {
    "t+1": {"capacity": 5_000_000, "utilization": 4_900_000},
    "t+30": {"capacity": 15_000_000, "utilization": 13_000_000}
  },
  "recommendations": []
}
```

- Producers: Liquidity Engine, Risk Guardian.
- Consumers: Commander, Rebalancing Agent, CryptoBro.

### TOKENIZED_LIQUIDITY_INJECTION

```json
{
  "asset_id": "uuid?",
  "instrument": "green_bond",
  "chain": "base",
  "size": 2000000,
  "expected_yield": 0.035,
  "compliance_tags": ["MiCA:L2", "ESG:A"]
}
```

- Producer: CryptoBro Agent (post-approval).
- Consumers: Liquidity Engine (update ladder), Compliance Sentinel (log), mem0 (story).

### RISK_ALERT

```json
{
  "alert_id": "uuid",
  "severity": "info|warn|critical",
  "metric": "VaR|Liquidity|ESG",
  "value": 0.12,
  "threshold": 0.1,
  "langfuse_trace_id": "lf_trace_...",
  "recommended_actions": ["increase_liquid_sleeve", "delay_deployment"]
}
```

- Producer: Risk Guardian with Langfuse context.
- Consumers: Commander, Compliance sentinel, AG-UI banner.

---

## Temporal Integration

- Bridge worker watches Supabase `fund_events` and starts workflows based on mapping.
- Workflow IDs mirrored back into event payload via `fn_record_event`.
- Long-running workflows emit intermediate events (e.g., `UNWIND_ASSET_STEP`, `KYC_STEP_APPROVED`) for UI progress bars.
- Replay strategy: event stream can be replayed by ordering on `created_at` and filtering by type; Commander uses mem0 to deduplicate actions.

---

## Governance & Monitoring

- Retention: 24 months in Supabase, archived nightly to S3 (`s3://evergreen-events/<env>/YYYY/MM/DD.parquet`).
- Langfuse: each event generates trace `events.<type>` with spans for producers/consumers.
- Compliance: `COMPLIANCE_BREACH` events require manual acknowledgment. Temporal workflow ensures `audit_trail` entry.
- Testing: Contract tests validate payload schema using Zod definitions in `packages/shared-utils/src/events/schema.ts`.

---

## Event Schema Package

`packages/shared-utils/src/events/` contains:

- `types.ts` – TypeScript types for each payload.
- `schema.ts` – Zod schemas for runtime validation.
- `publish.ts` – helper to insert events via Supabase RPC `fn_record_event`.
- `subscribe.ts` – Supabase Realtime listener with reconnection logic.

Agents import these helpers to ensure consistent typing and metrics tagging.

---

## Future Enhancements

- Add `EVENT_VERSION` header to handle schema evolution.
- Introduce tracing correlation with Temporal search attributes for advanced debugging.
- Provide redaction pipeline for LP-facing event feeds (remove sensitive metadata).

⸻
