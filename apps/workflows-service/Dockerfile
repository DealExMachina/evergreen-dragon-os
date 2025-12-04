# Workflows service Dockerfile
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY workflows ./workflows
COPY apps/workflows-service ./apps/workflows-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/workflows ./workflows
COPY --from=deps /app/apps/workflows-service ./apps/workflows-service
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Build packages
RUN pnpm --filter @evergreen/config build
RUN pnpm --filter @evergreen/shared-utils build
RUN pnpm --filter @evergreen/supabase-client build

# Build workflows service
WORKDIR /app/apps/workflows-service
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/workflows-service/dist ./apps/workflows-service/dist
COPY --from=builder /app/apps/workflows-service/package.json ./apps/workflows-service/
COPY --from=builder /app/workflows ./workflows
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/workflows-service

EXPOSE 4001

CMD ["node", "dist/index.js"]

