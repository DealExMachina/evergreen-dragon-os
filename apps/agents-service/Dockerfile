# Agents service Dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/agents-service ./apps/agents-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/agents-service ./apps/agents-service
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Build packages
RUN pnpm --filter @evergreen/config build
RUN pnpm --filter @evergreen/shared-utils build
RUN pnpm --filter @evergreen/supabase-client build
RUN pnpm --filter @evergreen/duckdb-kit build
RUN pnpm --filter @evergreen/mem0-client build

# Build agents service
WORKDIR /app/apps/agents-service
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/agents-service/dist ./apps/agents-service/dist
COPY --from=builder /app/apps/agents-service/package.json ./apps/agents-service/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/agents-service

EXPOSE 4000

CMD ["node", "dist/index.js"]

