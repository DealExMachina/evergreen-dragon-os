# Epoch Playbook: Liquidity Stress Response

⸻

## Purpose

Respond to sudden redemption spikes or market shocks by stabilizing liquidity, potentially invoking tokenized sleeves or gating mechanisms.

## Triggers

- `LIQUIDITY_STRESS` event (Liquidity Engine / Risk Guardian)
- `MARKET_SHOCK` event with liquidity impact
- Commander manual command (“Stress test liquidity”)

## Flow

1. **Detection**
   - Liquidity Engine posts ladder snapshot with gap calculation.
   - Risk Guardian corroborates using DuckDB liquidity tree.
2. **Assessment**
   - Commander gathers mem0 precedent.
   - Simulation Agent runs rapid scenarios (sell-down, tokenization, gating).
3. **Plan Selection**
   - Options scored vs policy and risk metrics.
   - Compliance Sentinel pre-check for MiCA/ELTIF compliance.
4. **Execution**
   - Temporal `LiquidityCrisisWorkflow` orchestrates actions:
     - Adjust redemption queues.
     - Trigger Rebalancing/Unwind.
     - Request CryptoBro tokenized injection if needed.
5. **Communication**
   - `fund_events` log plan steps.
   - AG-UI surfaces user-facing status, LP notices.
6. **Post-Mortem**
   - mem0 stores full narrative.
   - Commander issues recommendations for future prevention.

## KPIs

- Time from alert to plan execution start (< 5 min goal).
- Liquidity gap closed (%).
- Investor communication latency.

⸻

