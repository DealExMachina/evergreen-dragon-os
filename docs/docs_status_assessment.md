# Documentation Status Assessment

⸻

## Current Coverage

- `docs/00_overview.md`, `docs/01_architecture.md`, and `docs/architecture_scaffold.md` provide strong narrative, system architecture, and scaffolding guidance.
- `docs/04_agents/commander_prd.md` covers Commander plus core agents, but detailed PRDs for newly added Risk Guardian, Compliance Sentinel, and CryptoBro agents are embedded inline rather than standalone.
- `docs/infra_setup.md` describes infra provisioning steps.

## Gaps Identified

1. **Data Model (`docs/02_data_model.md`)**
   - Placeholder only; needs schema tables, relationships, retention policies, RLS/RBAC notes, and DuckDB materialization strategy.
2. **Event System (`docs/03_event_system.md`)**
   - Placeholder; should include event catalog (type, producer, consumer, payload schema, Temporal workflow triggers, mem0 hooks).
3. **Agent PRDs**
   - Risk Guardian, Compliance Sentinel, CryptoBro require deeper PRDs (inputs, outputs, SLAs, Langfuse metrics, escalation paths). Consider split files under `docs/04_agents/`.
4. **Epoch Playbooks (`docs/05_epoch_events/`)**
   - Only “Epoch onboard” stub. Need fleshed-out playbooks for onboarding, quarterly valuation, liquidity stress, MiCA tokenization.
5. **External Simulators (`docs/06_external_simulators/regulator_sim_prd.md`)**
   - Placeholder; should align with Regulation/Compliance flows once event catalog defined.
6. **README Navigation**
   - Currently minimal; should link to architecture overview, infra setup, data/event PRDs, agent docs.

## Next Actions

- Author comprehensive content for data model and event system.
- Produce specialized agent PRDs (Risk Guardian, Compliance Sentinel, CryptoBro) referencing Langfuse/Infisical integrations.
- Flesh out epoch event playbooks referencing new event catalog.
- Update README and architecture scaffold to link to all major docs once above sections exist.

⸻

