# Epoch Playbook: Asset Onboarding

⸻

## Objective

Bring a new asset (private credit, infrastructure, venture sleeve) into the Evergreen portfolio while preserving regulatory, liquidity, and valuation discipline.

## Triggering Events

- `ASSET_ONBOARD` (stage=`init`) event
- Human PM request via AG-UI (“Onboard asset” action)
- External allocation commitment

## Workflow Steps

1. **Intake & Classification**
   - KYC/Onboarding Agent ingests sponsor docs (MCP > OCR pipeline).
   - Compliance Sentinel validates eligibility, jurisdiction, ESG requirements.
   - Supabase `assets` row created with status `pending`.
2. **Due Diligence**
   - Commander requests Simulation Agent to run base valuation scenario.
   - mem0 stores historical analogs.
   - Risk Guardian reviews leverage, VaR forecasts.
3. **Liquidity Planning**
   - Liquidity Engine adjusts `liquidity_ladder` projections.
   - CryptoBro consulted if tokenized sleeve required to offset near-term funding.
4. **Approval Board**
   - Commander compiles recommendation.
   - Compliance Sentinel final sign-off logged in `compliance_logs`.
   - `ASSET_ONBOARD` event (stage=`approved`) emitted.
5. **Activation**
   - Portfolio allocations updated (target vs ramp schedule).
   - Temporal `AssetOnboardWorkflow` closes with `WORKFLOW_COMPLETED` event.
   - AG-UI timeline card summarises onboarding.

## Data Writes

- `assets`, `asset_snapshots`, `liquidity_ladder`, `fund_events`, `compliance_logs`, `audit_trail`.

## KPIs

- Time from intake to approval.
- Alignment of actual ramp vs planned ramp.
- Number of compliance exceptions raised.

⸻