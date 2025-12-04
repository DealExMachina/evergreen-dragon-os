import type { Config } from '@evergreen/config';
import { ServiceLifecycle, ServiceRunner } from '@evergreen/shared-utils';
import { createMastra, type MastraIntegrationContext } from './mastra';

/**
 * Agents Service
 * Orchestrates AI agents for Evergreen Dragon OS using Mastra
 * Integrates with Supabase Realtime, S3, mem0, Temporal, and CopilotKit
 */
class AgentsService implements ServiceLifecycle {
  private integrationContext: MastraIntegrationContext | null = null;

  getName(): string {
    return 'agents-service';
  }

  async initialize(config: Config): Promise<void> {
    // Initialize Mastra framework with all integrations
    this.integrationContext = await createMastra(config);
  }

  async start(): Promise<void> {
    if (!this.integrationContext) {
      throw new Error('Integration context not initialized');
    }

    // Agent mesh is ready after Mastra initialization
    // Additional startup logic can be added here
  }

  async cleanup(): Promise<void> {
    if (this.integrationContext) {
      await this.integrationContext.supabaseRealtime.cleanup();
      await this.integrationContext.temporal.cleanup();
    }
  }
}

// Run the service
new ServiceRunner(new AgentsService()).run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

