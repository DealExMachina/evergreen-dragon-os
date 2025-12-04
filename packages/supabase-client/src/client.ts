import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '@evergreen/config';
import { getLogger } from '@evergreen/shared-utils';
import { SupabaseError } from '@evergreen/shared-utils';

/**
 * Creates a Prisma client instance connected to Supabase Postgres
 * 
 * Note: DATABASE_URL should be set in environment variables.
 * For Supabase, use the connection pooling URL for queries and DIRECT_URL for migrations.
 * See docs/infra_setup.md for connection string configuration.
 */
export function createPrismaClient(config: Config): PrismaClient {
  const logger = getLogger();
  
  // DATABASE_URL should be set via environment variables (from Infisical or .env)
  // Prisma will read it from process.env.DATABASE_URL
  if (!process.env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set. Prisma client may fail to connect.');
  }

  const client = new PrismaClient({
    log: config.logLevel === 'debug' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

  // Handle connection errors gracefully
  client.$connect().catch((error) => {
    logger.error('Failed to connect to database', error);
    throw new SupabaseError('Database connection failed', { error: String(error) });
  });

  return client;
}

/**
 * Creates a Supabase client for Realtime subscriptions and RPC calls
 * Prisma handles ORM operations, Supabase client handles Realtime
 */
export function createSupabaseClient(config: Config): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client with anon key for frontend use
 */
export function createSupabaseAnonClient(config: Config): SupabaseClient {
  return createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      persistSession: false,
    },
  });
}

import { SingletonClientManager } from '@evergreen/shared-utils';

/**
 * Prisma client manager using singleton pattern
 */
export const prismaClientManager = new SingletonClientManager<PrismaClient>(
  (config) => createPrismaClient(config)
);

/**
 * Gets or creates the global Prisma client
 */
export function getPrismaClient(config?: Config): PrismaClient {
  return prismaClientManager.getClient(config);
}

/**
 * Sets the global Prisma client (useful for testing)
 */
export function setPrismaClient(client: PrismaClient): void {
  prismaClientManager.setClient(client);
}

/**
 * Resets the Prisma client manager (useful for testing)
 */
export function resetPrismaClient(): void {
  prismaClientManager.reset();
}

/**
 * Disconnects the Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  const client = prismaClientManager.isInitialized() ? prismaClientManager.getClient() : null;
  if (client) {
    await client.$disconnect();
    prismaClientManager.reset();
  }
}

