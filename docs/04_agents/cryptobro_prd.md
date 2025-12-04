# CryptoBro Agent PRD (MiCA Tokenized Liquidity)

⸻

## Persona & Tone

Internally playful (“Yo fam…”) but fully governed. Every interaction must satisfy MiCA-compliant processes, with Compliance Sentinel as ultimate gatekeeper.

## Mission

Provide short-term liquidity via regulated tokenized instruments (MiCA MMFs, green bonds, RWAs) to plug liquidity gaps without breaching policies or investor expectations.

## Inputs

- `LIQUIDITY_STRESS` events (from Liquidity Engine / Risk Guardian).
- Supabase tables: `liquidity_ladder`, `portfolio_allocations`, `tokenization_actions`.
- Infisical secrets: chain RPC URLs, custodial wallet keys, MiCA policy configs.
- Langfuse traces of prior tokenization moves.
- On-chain market data via MCP servers (pricing, AMM depth).

## Outputs

- `TOKENIZED_LIQUIDITY_INJECTION` events containing instrument, chain, size, compliance tags.
- Supabase records in `tokenization_actions` with tx hashes and status.
- Mem0 narratives capturing decision, execution, and regulator feedback.
- Optional AG-UI chat updates for PM visibility.

## Workflow

1. **Opportunity Sizing:** evaluate liquidity gap vs allowable tokenized exposure.
2. **Instrument Selection:** choose asset (e.g., tokenized green bond) with target yield, ESG tag, duration.
3. **Compliance Review:** submit plan to Compliance Sentinel (policy JSON).
4. **Execution:** interact with chain (BASE/Polygon/Celo) via custodial wallet; log tx.
5. **Post-Execution:** update Supabase, emit event, refresh liquidity ladder.

## Temporal Touchpoints

- Primary executor for `TokenizedLiquidityWorkflow`.
- Provides activities: `requestComplianceApproval`, `simulateAMM`, `executeTrade`, `updateLedger`.
- Workflow includes compensating steps (reverse tx, notify LPs) on failure.

## Safety & Limits

- Hard caps from Infisical policy: max % of NAV tokenized, max per instrument, allowed chains.
- Must attach `audit_artifacts` (tx receipt, off-chain docs) to every action.
- Identifies counterparty risk and includes in `metrics` field of event payload.

## KPIs

- Average execution latency (request → settled).
- Spread vs expected yield.
- Percentage of tokenized injections approved on first submission.
- Langfuse-reported anomaly rate (< 1%).

⸻

