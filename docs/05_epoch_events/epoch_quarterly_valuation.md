# Epoch Playbook: Quarterly Valuation

⸻

## Purpose

Deliver end-of-quarter NAV refresh with dual control, ensuring Supabase, DuckDB, and administrator numbers reconcile before investor reporting.

## Trigger

- Scheduled cron (Temporal schedule)
- `VALUATION_CYCLE` event initiated by Commander

## Sequence

1. **Preparation**
   - Commander fetches asset list with stale valuations.
   - NAV Oversight Agent retrieves administrator docs via MCP.
2. **Workflow Launch**
   - Temporal `QuarterlyValuationWorkflow` started with `workflow_id`.
   - Simulation Agent runs DuckDB valuation scenarios.
3. **Validation**
   - NAV Oversight compares Simulation outputs vs admin NAV; logs discrepancies.
   - Risk Guardian monitors for VaR shocks.
4. **Approval**
   - Compliance Sentinel reviews adjustments, records `compliance_logs`.
   - Commander synthesizes summary for AG-UI.
5. **Publication**
   - `asset_snapshots` & `fund_events` updated.
   - mem0 receives narrative.
   - AG-UI push notification to PM + LP portal.

## Event Emissions

- `VALUATION_CYCLE` (start)
- `DATA_DRIFT` (if mismatch)
- `WORKFLOW_COMPLETED` (success/failure)

## Checks

- Maximum variance threshold ±30 bps vs admin NAV.
- Ensure all assets have valuations ≤ 90 days old.

⸻

