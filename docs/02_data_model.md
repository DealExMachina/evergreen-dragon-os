# Operational & Analytical Data Model

⸻

## Guiding Principles

1. **Operational truth lives in Supabase (Postgres)** with row-level security (RLS) enforcing per-role access (PM, LP, Ops, Agents). **Prisma ORM** provides type-safe database access and migration management.
2. **Analytical/simulation data lives in DuckDB** snapshots that derive from Supabase data but may include synthetic scenarios and external market feeds.
3. **mem0 stores narrative intelligence**—references to Supabase primary keys and DuckDB scenario IDs keep memories traceable.
4. **Temporal workflows log into both Supabase (`workflow_runs`) and mem0** to ensure operational audit trails.

---

## Core Schemas (Supabase)

| Table | Purpose | Key Columns | Notes |
| --- | --- | --- | --- |
| `assets` | Master record for each asset or sleeve | `id (uuid)`, `type`, `strategy`, `status` | Linked to liquidity ladders, valuations |
| `asset_snapshots` | Time-series of valuations/metrics | `asset_id`, `as_of`, `nav`, `leverage`, `esg_score` | Written by Simulation Agent |
| `fund_flows` | Subscriptions/redemptions at order level | `flow_id`, `investor_id`, `asset_id`, `amount`, `status` | Drives liquidity planning |
| `subscriptions`, `redemptions` | Normalized views of fund flows | `subscription_id`, `channel`, `eligibility_tag` | Used by KYC + Liquidity Engine |
| `portfolio_allocations` | Target vs actual exposures | `asset_id`, `target_pct`, `actual_pct`, `liquid_flag` | Commander reads, Rebalancing writes |
| `liquidity_ladder` | Liquidity buckets (T+1, T+30, etc.) | `bucket`, `capacity`, `utilization`, `stress_delta` | Liquidity Engine + Risk Guardian |
| `fund_events` | Event bus (see docs/03_event_system.md) | `event_id`, `type`, `payload`, `source`, `created_at` | Driving Temporal triggers |
| `workflow_runs` | Mirror of Temporal workflow metadata | `workflow_id`, `type`, `status`, `started_at`, `ended_at` | Commander and compliance use |
| `investors`, `investors_pending_kyc` | Investor master + pipeline | `investor_id`, `classification`, `kyc_status`, `eligibility_tags` | KYC agent + Compliance Sentinel |
| `compliance_logs` | All compliance checks/actions | `log_id`, `actor`, `rule`, `result`, `attachment_url` | Infisical stores rule config |
| `audit_trail` | High-level audit entries | `audit_id`, `entity_type`, `entity_id`, `message`, `created_at`, `created_by` | For regulators |
| `tokenization_actions` | CryptoBro operations | `action_id`, `chain`, `instrument`, `size`, `status`, `tx_hash` | References compliance approvals |

All tables share `created_at`/`updated_at` with default triggers. **Prisma manages schema migrations** via `packages/supabase-client/prisma/schema.prisma`. Agents use Prisma Client for type-safe queries, while Supabase client handles Realtime subscriptions. RLS policies restrict writes to specific RPC functions.

---

## Relationships & ER Highlights

- `assets` 1→N `asset_snapshots`, `portfolio_allocations`, `tokenization_actions`.
- `investors` 1→N `fund_flows`, `subscriptions`, `redemptions`.
- `fund_events.payload -> assets`, `fund_events.payload -> investors`, `fund_events.payload -> workflow_runs` using JSONB references.
- `workflow_runs.workflow_id` <- Temporal workflow IDs; attaches to `fund_events` via `event_meta.workflow_id`.
- `mem0` stores `reference_ids` array linking memories to Supabase IDs.

Graph-style depiction:
```
investors ── fund_flows ──> liquidity_ladder
      │                        │
      └─ investors_pending_kyc │
                               ▼
assets ─ asset_snapshots ─ portfolio_allocations
   │             │
   └─ tokenization_actions
```

---

## Prisma ORM Integration

- **Schema Management**: Prisma schema lives in `packages/supabase-client/prisma/schema.prisma`. Models are generated from this schema or introspected from the database via `prisma db pull`.
- **Migrations**: Run `prisma migrate dev` to create and apply migrations. Production uses `prisma migrate deploy`.
- **Connection**: Prisma uses `DATABASE_URL` for queries (connection pooling) and `DIRECT_URL` for migrations (direct connection).
- **Type Safety**: All database operations use Prisma Client with full TypeScript type inference.
- **Realtime**: Supabase client (separate from Prisma) handles Realtime subscriptions for event-driven workflows.

## Governance & Access

- Roles: `service_role` (Temporal + agents), `pm_role`, `lp_role`, `audit_role`.
- RLS examples:
  - `fund_events`: `pm_role` sees all, `lp_role` only events referencing their investor_id, `audit_role` read-only.
  - `asset_snapshots`: `lp_role` filtered by assets flagged `lp_visible`.
- **Note**: Prisma queries bypass RLS since they connect directly to Postgres. Implement authorization checks in application code.
- Column-level encryption for sensitive fields (KYC documents) using Supabase Vault extension.

Retention:

- `fund_events`: 24 months (archived to S3 bucket + DuckDB for analytics).
- `asset_snapshots`: daily for 10 years; aggregated monthly in DuckDB.
- `compliance_logs`: indefinite retention per MiCA requirements.

---

## DuckDB Analytical Model

### Storage

- Primary database file per environment stored at `s3://evergreen-analytics/<env>/duckdb.db`.
- Local dev uses `./analytics/dev.duckdb`.

### Tables / Views

| Table/View | Description | Source |
| --- | --- | --- |
| `scenario_params` | Stress scenarios (+200bps, FX shocks) | YAML → DuckDB |
| `valuation_runs` | Output per scenario per asset | Derived from Supabase `asset_snapshots` + market feeds |
| `liquidity_risk_tree` | Computed liquidity waterfall | Aggregates `liquidity_ladder` + `fund_flows` |
| `esg_scores` | ESG metrics per asset/time | External data join |
| `tokenization_models` | AMM curves, expected slippage | CryptoBro uses |

### Sync Strategy

1. Simulation Agent pulls Supabase delta since last run via `updated_at`.
2. Writes to DuckDB staging tables.
3. Commits scenario outputs back to Supabase (`asset_snapshots`, `fund_events`) and mem0.
4. Daily snapshot exported to S3 for reproducibility.

---

## mem0 Entity Graph

- `nodes`: `Asset`, `Scenario`, `Workflow`, `Investor`, `Policy`.
- `edges`: `caused`, `resolved_with`, `violated`, `prefers`.
- Each memory stores `supabase_refs`, `duckdb_refs`, `workflow_id`, `langfuse_trace_id`.
- Commander fetches top memories by embedding similarity prior to reasoning.

---

## RPC Functions (Supabase)

| Function | Purpose | Inputs | Outputs |
| --- | --- | --- | --- |
| `fn_record_event` | Insert into `fund_events` with validation | `type`, `payload`, `source`, `workflow_id?` | `event_id` |
| `fn_update_liquidity_bucket` | Adjust `liquidity_ladder` row atomically | `bucket`, `delta_capacity`, `context` | updated row |
| `fn_complete_workflow` | Mirror Temporal completion, update audit | `workflow_id`, `status`, `metadata` | `workflow_runs` row |
| `fn_assign_investor` | Move from pending KYC to investors | `pending_id`, `classification` | new `investor_id` |

All RPC functions log to `audit_trail` automatically.

---

## Data Quality & Monitoring

- Supabase: Postgres triggers emit `DATA_DRIFT` events when valuations deviate > configured thresholds.
- DuckDB: nightly validation query compares aggregated Supabase NAV vs DuckDB valuations.
- Langfuse: attaches data pipeline spans (`data.load.supabase`, `data.transform.duckdb`).
- Risk Guardian consumes these metrics to alert Commander.

---

## Future Enhancements

- Implement Supabase row-level versioning via `pgmemento` for regulator time-travel queries.
- Add DuckDB “laboratory” schema for what-if analyses persistent per PM.
- Mirror select Supabase tables into BigQuery/Snowflake if downstream reporting requires.

⸻