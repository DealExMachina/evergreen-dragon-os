# Infra Setup Guide

⸻

## 0. Prerequisites

- **Node.js 22.x LTS**, **pnpm ≥ 9.0**
- Docker Desktop (for local Temporal, Supabase, Langfuse containers).
- Pulumi CLI (`curl -fsSL https://get.pulumi.com | sh`).
- Supabase CLI (`brew install supabase/tap/supabase` or `npm i -g supabase`).
- Temporal CLI (`brew install temporal`).
- Infisical CLI (`brew install infisical/get-infisical/infisical`).
- **Prisma CLI** (included via `@prisma/client` dependency).
- Access tokens:
  - Pulumi access token for your organization stack.
  - Supabase service role or new project credentials.
  - Temporal Cloud API key (or credentials to run self-hosted).
  - Langfuse host URL + API keys (can self-host via Docker).
  - Infisical workspace ID + machine token.

---

## 1. Repository Initialization

1. Clone `evergreen-dragon-os` and run `pnpm install`.
2. Copy `.env.example` → `.env`. Only keep non-secret defaults; all secrets will be injected by Infisical.
3. Bootstrap shared packages:
   ```bash
   pnpm --filter @evergreen/config run build
   pnpm --filter @evergreen/shared-utils run build
   ```
4. **Prisma setup** (after Supabase is provisioned):
   - Set `DATABASE_URL` and `DIRECT_URL` in `.env` (see Supabase setup section).
   - Run `pnpm --filter @evergreen/supabase-client prisma generate` to generate Prisma Client.
   - If database already has tables: `pnpm --filter @evergreen/supabase-client prisma db pull` to introspect schema.
   - If starting fresh: Define models in `packages/supabase-client/prisma/schema.prisma` then run `pnpm --filter @evergreen/supabase-client prisma migrate dev`.

---

## 2. Infisical Configuration

1. Create an Infisical project named `evergreen-dragon-os`.
2. Define environments: `dev`, `staging`, `prod`.
3. For each environment, add secrets:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
   - `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_TASK_QUEUE`
   - `LANGFUSE_BASE_URL`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`
   - `MEM0_BASE_URL`, `MEM0_API_KEY`
   - `INFISICAL_PROJECT_TOKEN` (machine identity token for agents)
   - `CRYPTOBRO_CHAIN_RPC_<CHAIN>` etc.
4. Generate machine tokens per service (e.g., `agents-service-dev`). Store tokens in local `.env.infisical` for CLI pulls.
5. Update `packages/config/src/infisical.ts` to call `InfisicalClient().getAllSecrets()` and merge with defaults.

Pull secrets locally:
```bash
infisical login --method token --token $INFISICAL_MACHINE_TOKEN
infisical pull --environment=dev --path=/
```

---

## 3. Pulumi Infrastructure

### 3.1 Stack Layout

- `infra/pulumi`
  - `Pulumi.dev.yaml`
  - `Pulumi.staging.yaml`
  - `Pulumi.prod.yaml`
  - `index.ts` (main program)
  - `temporal.ts`, `supabase.ts`, `langfuse.ts`, `network.ts`

### 3.2 Providers

- Temporal: `@temporalio/pulumi` (or use Kubernetes manifests for self-hosted).
- Supabase: provision via Pulumi automation or use manual project and store outputs as Pulumi config.
- AWS/Azure/GCP: whichever hosts the containers (EKS/GKE/AKS). Example uses AWS.
- Langfuse: if self-hosted, Pulumi provisions ECS/Kubernetes service; if SaaS, store API keys.

### 3.3 Workflow

1. Login: `pulumi login s3://evergreen-pulumi-state` (example backend).
2. Configure stack:
   ```bash
   pulumi stack select org/evergreen/dev
   pulumi config set aws:region eu-central-1
   pulumi config set supabase:projectId <id>
   pulumi config set temporal:namespace evergreen-dev
   pulumi config set langfuse:url https://langfuse.dev.company.com
   ```
3. Run `pulumi up`. Outputs should include:
   - `supabase-url`
   - `supabase-service-key`
   - `temporal-address`
   - `langfuse-base-url`
   - `langfuse-api-key`
4. Pipe outputs into Infisical:
   ```bash
   pulumi stack output --json | jq -r 'to_entries[] | "\(.key)=\(.value)"' \
     | while read line; do
         infisical secrets set --environment=dev --path=/ --secret="$line"
       done
   ```

---

## 4. Supabase Setup

1. Create project via Supabase dashboard or CLI: `supabase projects create evergreen-dev`.
2. Note anon + service keys; ingest into Infisical.
3. **Create Prisma database user** (recommended for security):
   ```sql
   CREATE USER prisma WITH PASSWORD 'your_secure_password' BYPASSRLS CREATEDB;
   GRANT USAGE ON SCHEMA public TO prisma;
   GRANT CREATE ON SCHEMA public TO prisma;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
   ```
4. **Configure Prisma connection strings**:
   - In Supabase Dashboard → Settings → Database, get connection strings.
   - Set `DATABASE_URL` to Transaction Pooler (port 6543) for queries: `postgresql://prisma.[project-ref]:[password]@[region].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Set `DIRECT_URL` to Session Pooler (port 5432) for migrations: `postgresql://prisma:[password]@db.[project-ref].supabase.co:5432/postgres`
   - Store both in Infisical and `.env` for local dev.
5. **Run Prisma migrations**:
   ```bash
   cd packages/supabase-client
   pnpm prisma migrate dev --name init
   # Or if schema already exists:
   pnpm prisma db pull  # Introspect existing schema
   pnpm prisma generate  # Generate Prisma Client
   ```
6. Enable Realtime on tables (`fund_events`, etc.) via Supabase Dashboard.
7. Define RLS policies for `edge_role`.
8. Configure webhooks (if needed) to call Temporal when specific events occur.

---

## 5. Temporal Setup

### Temporal Cloud

1. Create namespace `evergreen-dev`.
2. Generate application key for workers.
3. Update Infisical secrets.

### Self-hosted (Docker)

```bash
cd infra/docker
docker compose up temporal temporal-ui
temporal operator namespace create evergreen-dev --address localhost:7233
```

Register task queues via CLI or worker code (`workflows-service` automatically registers when running).

---

## 6. Langfuse Observability

### SaaS

1. Create project `evergreen-dev`.
2. Generate public + secret keys.
3. Store in Infisical.

### Self-hosted

```bash
docker compose up langfuse
```

Set `LANGFUSE_BASE_URL` to `http://localhost:3000` for dev.

Integrate by configuring `packages/shared-utils/src/telemetry/langfuseClient.ts`:
```ts
import { Langfuse } from "langfuse";

export const langfuse = new Langfuse({
  secretKey: config.langfuse.secretKey,
  publicKey: config.langfuse.publicKey,
  baseUrl: config.langfuse.baseUrl,
});
```

Agents and workflows import this client to emit traces.

---

## 7. Local Development Environment

1. `docker compose -f infra/docker/compose.dev.yml up supabase temporal langfuse`
2. Seed data: `pnpm --filter @evergreen/scripts run seed`.
3. Start services:
   ```bash
   pnpm --filter ag-ui dev
   pnpm --filter agents-service dev
   pnpm --filter workflows-service dev
   ```
4. Ensure Infisical secrets are injected: `infisical run -- pnpm dev`.

---

## 8. CI/CD Flow

1. GitHub Actions secrets:
   - `PULUMI_ACCESS_TOKEN`
   - `INFISICAL_CLIENT_ID/SECRET` (if using OAuth) or machine token.
2. Workflow outline:
   - `pnpm install --frozen-lockfile`
   - `pnpm lint && pnpm test`
   - `pnpm --filter workflows-service build` etc.
   - `pulumi up --stack org/evergreen/$ENV --yes`
   - `infisical run -- pnpm deploy` (for app deploys)
3. After deployment, hit Langfuse API to tag release: `curl -X POST https://langfuse.../releases`.

---

## 9. Risk & Compliance Agent Monitoring

- Ensure Langfuse project retains at least 30 days of traces for audit.
- Configure alerting (PagerDuty/Slack) for `Risk Guardian` triggered events via Langfuse webhooks.
- Compliance Sentinel requires access to Infisical policy documents; store JSON policies under `/policies/<name>.json` secrets.

---

## 10. Verification Checklist

- [ ] Pulumi stack outputs visible and exported to Infisical.
- [ ] Supabase tables + RLS applied.
- [ ] **Prisma Client generated** (`pnpm --filter @evergreen/supabase-client prisma generate`).
- [ ] **Prisma migrations applied** (`pnpm --filter @evergreen/supabase-client prisma migrate deploy`).
- [ ] `DATABASE_URL` and `DIRECT_URL` configured in Infisical and `.env`.
- [ ] Temporal namespace reachable from workflows-service.
- [ ] Langfuse receiving traces from `pnpm test` runs.
- [ ] AG-UI loads Tailwind config and displays Langfuse alert banners.
- [ ] Risk Guardian + Compliance Sentinel have valid machine tokens.
- [ ] CI pipeline can pull secrets and run Pulumi without manual steps.

⸻

