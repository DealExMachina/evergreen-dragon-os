# Architecture Scaffold

⸻

## Repository Scaffolding & Configuration System

Detailed provisioning steps live in [`docs/infra_setup.md`](docs/infra_setup.md). This section focuses on structure and configuration contracts referenced by that guide.

Reference docs for downstream teams:

- Data contracts: [`docs/02_data_model.md`](docs/02_data_model.md)
- Event catalog: [`docs/03_event_system.md`](docs/03_event_system.md)
- Agent PRDs: [`docs/04_agents/`](docs/04_agents/)
- Epoch playbooks: [`docs/05_epoch_events/`](docs/05_epoch_events/)

## Monorepo Layout (pnpm workspaces)

```text
evergreen-dragon-os/
├─ apps/
│  ├─ ag-ui/                 # Next.js + CopilotKit frontend (Tailwind design system)
│  ├─ agents-service/        # Mastra agent mesh (Commander + specialists)
│  └─ workflows-service/     # Temporal worker bundle (TypeScript)
├─ packages/
│  ├─ config/                # Typed config loader (Zod + Infisical)
│  ├─ supabase-client/       # Prisma ORM + Supabase Realtime client
│  ├─ duckdb-kit/            # DuckDB adapters + scenario runners
│  ├─ mem0-client/           # mem0 SDK wrapper
│  └─ shared-utils/          # Logging, tracing, feature flags
├─ infra/
│  ├─ docker/                # Compose files, Temporal, Supabase local stack
│  ├─ pulumi/                # Pulumi IaC stacks (cloud + Langfuse + networking)
│  └─ terraform/             # Optional legacy provisioning (Temporal Cloud, Supabase, etc.)
├─ workflows/                # Temporal definitions (compiled into workflows-service)
├─ docs/
└─ package.json / pnpm-workspace.yaml
```

`pnpm-workspace.yaml` includes `apps/*`, `packages/*`, `workflows`. Each app/package has its own `tsconfig.json`, but top-level `tsconfig.base.json` enforces shared path aliases (`@evergreen/*`).

## Configuration Strategy

- **Source of Truth:** `packages/config` exports a `loadConfig()` function returning a typed object validated via Zod. It aggregates defaults, `.env` files, and Infisical-managed secrets.
- **Layering Order:**
  1. `defaults/*.ts` – environment-agnostic baseline values.
  2. `.env` / `.env.local` – developer overrides (never committed).
  3. Secret manager (1Password, Doppler, AWS Secrets Manager, etc.) – production credentials.
  4. Runtime overrides (CLI flags, process env).
- **Consumption:** All apps import from `@evergreen/config`. No component reads `process.env` directly.
- **Infisical Loader:** Config package provides `withInfisical(projectSlug, env)` helper to fetch encrypted variables at boot (Supabase, mem0, Langfuse, MCP, Temporal credentials).
- **Schema Enforcement:** Example snippet:

```ts
const schema = z.object({
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string(),
    serviceKey: z.string(),
  }),
  duckdb: z.object({
    path: z.string(),          // local file or s3:// path
    s3AccessKey: z.string().optional(),
  }),
  temporal: z.object({
    address: z.string(),
    namespace: z.string(),
    taskQueue: z.string(),
  }),
  mem0: z.object({
    baseUrl: z.string().url(),
    apiKey: z.string(),
  }),
  cryptoBro: z.object({
    mikaComplianceLevel: z.enum(["light", "full"]).default("full"),
    chainRpcUrls: z.record(z.string(), z.string().url()),
  }),
});
```

## Environment Variable Catalog

| Key | Description | Scope | Secret? |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Supabase project URL | all services | no |
| `SUPABASE_ANON_KEY` | anon key for AG-UI | ag-ui | yes (frontend secret storage via env var injection) |
| `SUPABASE_SERVICE_KEY` | service role for agents/workflows | agents-service, workflows-service | yes |
| `DATABASE_URL` | Prisma connection string (pooled, port 6543) | agents-service, workflows-service | yes |
| `DIRECT_URL` | Prisma direct connection (migrations, port 5432) | CI/CD, local dev | yes |
| `DUCKDB_FILE` | path to DuckDB database | agents-service | no |
| `DUCKDB_S3_ACCESS_KEY` / `DUCKDB_S3_SECRET_KEY` | optional remote storage creds | agents-service | yes |
| `TEMPORAL_ADDRESS` | Temporal front-end endpoint | workflows-service, agents-service | no |
| `TEMPORAL_NAMESPACE` | namespace for workflows | workflows-service | no |
| `TEMPORAL_TASK_QUEUE` | default task queue | workflows-service | no |
| `MEM0_BASE_URL` / `MEM0_API_KEY` | mem0 connectivity | agents-service | yes |
| `MCP_ENDPOINTS` | JSON list of MCP servers (docs, pricing) | agents-service | no |
| `CRYPTOBRO_CHAIN_RPC_<CHAIN>` | RPC endpoints for tokenized liquidity chains | agents-service | yes |
| `COPILOTKIT_API_KEY` | UI copilot features | ag-ui | yes |
| `LANGFUSE_BASE_URL` / `LANGFUSE_SECRET_KEY` | Observability + tracing backend | agents-service, workflows-service | yes |
| `INFISICAL_PROJECT_TOKEN` | Access token for Infisical secrets | all services | yes |

Secret storage recommendation: reference manager-provided env substitution (e.g., Doppler, AWS Parameter Store). For local dev, rely on `.env` files ignored by git plus `pnpm dlx dotenv-vault`.

## Docker & Local Dev

- `docker-compose.dev.yml` launches:
  - Supabase stack (using Supabase CLI or official Docker images).
  - Temporal cluster (temporalio/auto-setup) + web UI.
  - DuckDB does not require a daemon; we mount a volume for persistence.
  - Optional mem0 mock server for offline development.
  - Langfuse self-hosted container for local tracing playback.
- Each app has a corresponding Dockerfile:
  - `apps/ag-ui/Dockerfile` – multi-stage Next.js build (pnpm install → build → standalone).
  - `apps/agents-service/Dockerfile` – Node 22 base, installs pnpm deps, runs Mastra agent service.
  - `apps/workflows-service/Dockerfile` – Node 20 + Temporal worker binary.
- A root `Makefile` (or `justfile`) wraps common workflows: `make dev`, `make temporal`, `make lint`, `make test`.

## Temporal Integration

- `workflows/` contains TypeScript workflow definitions compiled via `tsc` into the `workflows-service`.
- Activity workers reside in `apps/workflows-service/src/activities`.
- `packages/config` exposes Temporal connection helpers, ensuring namespace/task queue pulled from typed config.
- Local dev uses Temporal CLI for namespace registration; production leverages Temporal Cloud (namespace = `evergreen-funds`).
- Pulumi stack outputs (Temporal namespace, Langfuse endpoint, Supabase keys) are piped into Infisical so runtime services remain environment-agnostic.

## Supabase & DuckDB Credential Flow

1. `packages/config` reads Supabase URL/keys and exports typed clients via `packages/supabase-client`.
2. **Prisma Client** connects using `DATABASE_URL` (connection pooling) for queries and `DIRECT_URL` for migrations.
3. **Supabase Client** (separate instance) handles Realtime subscriptions using service key server-side; AG-UI uses anon key with RLS policies.
4. DuckDB path/credentials injected into Simulation Agent; if remote object storage is used, credentials stay within agent pods.
5. No credential is ever hard-coded in repo; CI/CD injects via environment.

## Testing & Quality Gates

- `pnpm lint` with ESLint/TypeScript strict mode across workspace.
- `pnpm test` for unit/integration; Temporal workflows covered using Temporal testing framework.
- Contract tests for Supabase RPC functions (via pgTap or custom harness).
- Replay tests for DuckDB scenarios to ensure deterministic outputs.
- Langfuse regression dashboards confirm agent reasoning quality (alerts become CI gates over time).

## Deployment Considerations

- GitHub Actions (or Temporal Cloud deployments) run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm build`.
- Docker images pushed per app; Infra repo orchestrates Kubernetes or Fly.io deployment.
- Feature environments: leverage Supabase branching + Temporal namespaces per branch when feasible.
- Pulumi deployments output environment-specific metadata (Temporal namespace, Langfuse IDs, custom domains) that GitHub Actions writes into Infisical so runtime workloads stay secretless.

## Observability & UX Notes

- Langfuse API keys live in Infisical; `packages/config` shares a typed telemetry client consumed by agents/workflows.
- Tailwind CSS config (colors, transparency scale) resides in `apps/ag-ui/tailwind.config.ts`; design tokens are shared via `packages/shared-utils/ui`.
- Risk Guardian and Compliance Sentinel ship Langfuse trace URLs back to AG-UI so PMs can inspect agent reasoning before approving workflows.

⸻
