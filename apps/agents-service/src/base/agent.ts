import type { Config } from '@evergreen/config';
import type { Logger } from '@evergreen/shared-utils';
import type { PrismaClient } from '@prisma/client';
import type { Mem0Client } from '@evergreen/mem0-client';
import type { AgentContext } from '../context/agent-context';

/**
 * Base agent class with shared utilities
 */
export abstract class BaseAgent {
  protected readonly config: Config;
  protected readonly logger: Logger;
  protected readonly prisma: PrismaClient;
  protected readonly mem0: Mem0Client;
  protected readonly integrations: AgentContext['integrations'];

  constructor(protected readonly context: AgentContext) {
    this.config = context.config;
    this.logger = context.logger;
    this.prisma = context.prisma;
    this.mem0 = context.mem0;
    this.integrations = context.integrations;
  }

  /**
   * Gets agent name
   */
  abstract getName(): string;

  /**
   * Processes a request
   */
  abstract process(input: unknown): Promise<unknown>;
}

