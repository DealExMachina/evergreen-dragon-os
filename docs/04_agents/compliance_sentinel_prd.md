# Compliance Sentinel Agent PRD

⸻

## Mission

Guarantee Evergreen Dragon OS operations adhere to ELTIF 2.0, MiCA, AIFMD, AML/KYC, and internal governance policies by reviewing workflows, events, and tokenized actions before execution.

## Scope

- Policy enforcement across onboarding, valuations, liquidity actions, tokenization, and investor communications.
- Approval workflow for sensitive steps (e.g., gating, asset unwind, CryptoBro deployments).
- Regulatory audit logging with mem0 narratives plus Supabase `compliance_logs`.

## Inputs

- Supabase tables: `investors_pending_kyc`, `compliance_logs`, `tokenization_actions`, `workflow_runs`.
- Infisical policy bundles under `/policies/compliance/*.json`.
- Langfuse traces from agents/workflows for reasoning transparency.
- Document MCP feeds (regulator notices, updated rulebooks).
- Commander plans and Risk Guardian alerts.

## Outputs

- `COMPLIANCE_BREACH` events with rule references.
- Approvals/denials recorded via `compliance_logs` + mem0.
- Temporal workflow signals (pause/resume) for `KycWorkflow`, `AssetUnwindWorkflow`, `TokenizedLiquidityWorkflow`.
- LP/PM notices surfaced via AG-UI compliance panel.

## Lifecycle

1. **Pre-check:** intercepts event/command, validates against policy (Zod schemas + Infisical rules).
2. **Decision:** uses Mastra reasoning template referencing mem0 prior cases and Langfuse trace.
3. **Action:** publishes approval/denial, triggers follow-on workflows, updates audit trails.
4. **Post-check:** monitors execution outcomes; if deviations occur, emits `COMPLIANCE_BREACH`.

## Policy Categories

- **Investor Eligibility:** retail limits, ERISA feeders, suitability scoring.
- **Liquidity Governance:** redemption gates, queue priorities, MiCA tokenization caps.
- **Valuation Controls:** ensuring dual control vs administrator NAV, stale data detection.
- **Web3/MiCA:** chain allowlists, instrument types, reporting obligations.

## Guardrails

- Must include `policy_version` and `reviewer` metadata in every approval.
- Cannot run actions without Langfuse trace context.
- Access to secrets limited via Infisical scope `compliance-sentinel`.

## KPIs

- Time-to-approve for standard workflows (< 2 minutes).
- Number of automatic approvals vs manual escalations.
- Compliance breach recurrence rate.
- Audit readiness (percentage of actions with full trace + mem0 narrative).

⸻

