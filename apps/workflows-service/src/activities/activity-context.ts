import { loadConfig } from '@evergreen/config';
import type { Config } from '@evergreen/config';
import { getPrismaClient, type PrismaClient } from '@evergreen/supabase-client';
import { getMem0Client, type Mem0Client } from '@evergreen/mem0-client';
import { getLogger, type Logger, withErrorHandling } from '@evergreen/shared-utils';

interface ActivityContext {
  config: Config;
  prisma: PrismaClient;
  mem0: Mem0Client;
  logger: Logger;
}

let cachedContext: ActivityContext | null = null;

async function getActivityContext(): Promise<ActivityContext> {
  if (!cachedContext) {
    const config = await loadConfig();
    cachedContext = {
      config,
      prisma: getPrismaClient(config),
      mem0: getMem0Client(config),
      logger: getLogger(),
    };
  }
  return cachedContext;
}

export async function withActivityContext<T>(
  operation: string,
  fn: (ctx: ActivityContext) => Promise<T>
): Promise<T> {
  const context = await getActivityContext();
  return withErrorHandling(() => fn(context), { operation });
}

