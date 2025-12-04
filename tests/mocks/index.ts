import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Mem0Client } from '@evergreen/mem0-client';
import type { Config } from '@evergreen/config';
import { createMockConfig } from '../fixtures';

/**
 * Creates a mock Prisma client
 */
export function createMockPrismaClient(): Partial<PrismaClient> {
  return {
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    // Add common model mocks
    investor: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    asset: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    event: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  } as unknown as PrismaClient;
}

/**
 * Creates a mock Supabase client
 */
export function createMockSupabaseClient(): Partial<SupabaseClient> {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockResolvedValue({ status: 'SUBSCRIBED' }),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
    }),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  } as unknown as SupabaseClient;
}

/**
 * Creates a mock Mem0 client
 */
export function createMockMem0Client(): Partial<Mem0Client> {
  return {
    createMemory: vi.fn(),
    searchMemories: vi.fn(),
    getMemory: vi.fn(),
    updateMemory: vi.fn(),
    deleteMemory: vi.fn(),
    createEntity: vi.fn(),
    queryEntityGraph: vi.fn(),
    createRelationship: vi.fn(),
    getEntity: vi.fn(),
  } as unknown as Mem0Client;
}

/**
 * Creates a mock Temporal client
 */
export function createMockTemporalClient() {
  return {
    connection: {
      connect: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    },
    workflow: {
      execute: vi.fn(),
      start: vi.fn(),
      signal: vi.fn(),
      query: vi.fn(),
      terminate: vi.fn(),
    },
    activity: {
      execute: vi.fn(),
    },
  };
}

/**
 * Creates a mock DuckDB connection
 */
export function createMockDuckDBConnection() {
  return {
    query: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    all: vi.fn(),
    run: vi.fn(),
  };
}

/**
 * Mocks fetch globally
 */
export function mockFetch(response: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
    headers: new Headers({ 'content-type': 'application/json' }),
  } as Response);
}

/**
 * Mocks fetch with error
 */
export function mockFetchError(error: Error) {
  global.fetch = vi.fn().mockRejectedValue(error);
}

/**
 * Resets all mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks();
}

