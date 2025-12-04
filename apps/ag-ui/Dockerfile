# Multi-stage build for Next.js AG-UI
FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/ag-ui ./apps/ag-ui

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/ag-ui ./apps/ag-ui
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Build packages
RUN pnpm --filter @evergreen/config build
RUN pnpm --filter @evergreen/shared-utils build
RUN pnpm --filter @evergreen/supabase-client build

# Build Next.js app
WORKDIR /app/apps/ag-ui
RUN pnpm build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/ag-ui/.next/standalone ./
COPY --from=builder /app/apps/ag-ui/.next/static ./apps/ag-ui/.next/static
COPY --from=builder /app/apps/ag-ui/public ./apps/ag-ui/public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/ag-ui/server.js"]

