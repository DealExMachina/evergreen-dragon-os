# Docker Compose for Local Development

This directory contains Docker Compose configurations for running local development services.

## Services

- **Supabase**: Local PostgreSQL database with Supabase Studio UI
- **Temporal**: Temporal workflow engine with UI
- **Langfuse**: Observability and tracing platform

## Usage

### Start all services

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Stop all services

```bash
docker compose -f docker-compose.dev.yml down
```

### View logs

```bash
docker compose -f docker-compose.dev.yml logs -f [service-name]
```

### Access services

- **Supabase Studio**: http://localhost:54323
- **Temporal UI**: http://localhost:8088
- **Langfuse**: http://localhost:3000
- **Supabase DB**: localhost:54322
- **Temporal DB**: localhost:54324
- **Langfuse DB**: localhost:54325

## Environment Variables

Create a `.env` file in this directory to override default settings:

```env
POSTGRES_PASSWORD=your-password
TEMPORAL_NAMESPACE=evergreen-dev
LANGFUSE_SECRET_KEY=your-secret-key
```

## Data Persistence

All data is persisted in Docker volumes. To reset:

```bash
docker compose -f docker-compose.dev.yml down -v
```

## Health Checks

All services include health checks. Wait for services to be healthy before connecting:

```bash
docker compose -f docker-compose.dev.yml ps
```

