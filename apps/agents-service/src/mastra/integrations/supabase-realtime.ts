import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Config } from '@evergreen/config';
import { BaseIntegration, withErrorHandling } from '@evergreen/shared-utils';
import { RealtimeSubscriptionManager } from '@evergreen/supabase-client';
import type { Mastra } from '@mastra/core';
import type { EventRouter } from './contracts';

/**
 * Sets up Supabase Realtime subscriptions for Mastra agents
 * Agents can subscribe to table changes and events
 */
export class SupabaseRealtimeIntegration
  extends BaseIntegration
  implements EventRouter
{
  private client: SupabaseClient | null = null;
  private subscriptionManager: RealtimeSubscriptionManager | null = null;
  private mastra: Mastra | null = null;
  private agentMap: Record<string, string> = {};

  constructor(mastra?: Mastra) {
    super();
    if (mastra) {
      this.mastra = mastra;
    }
  }

  setMastra(mastra: Mastra): void {
    this.mastra = mastra;
  }

  /**
   * Initialize Supabase Realtime integration
   */
  protected async doInitialize(config: Config): Promise<void> {
    this.client = createClient(config.supabase.url, config.supabase.serviceKey);
    this.subscriptionManager = new RealtimeSubscriptionManager(this.client);
    this.agentMap = config.agentRouting?.eventToAgent ?? {};
  }

  /**
   * Cleanup subscriptions
   */
  protected async doCleanup(): Promise<void> {
    if (this.subscriptionManager) {
      await this.subscriptionManager.cleanup();
      this.subscriptionManager = null;
    }
    this.client = null;
  }

  /**
   * Get Supabase client
   */
  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }
    return this.client;
  }

  /**
   * Get subscription manager
   */
  private getSubscriptionManager(): RealtimeSubscriptionManager {
    if (!this.subscriptionManager) {
      throw new Error('Subscription manager not initialized');
    }
    return this.subscriptionManager;
  }

  /**
   * Subscribe to fund_events table for agent triggers
   */
  subscribeToEvents(
    callback: (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => Promise<void>
  ): void {
    const manager = this.getSubscriptionManager();
    manager.subscribe('fund_events', async (payload) => {
      await callback({
        eventType: payload.eventType,
        new: payload.new as Record<string, unknown>,
        old: payload.old as Record<string, unknown>,
      });
    });
  }

  /**
   * Subscribe to asset changes for NAV/valuation triggers
   */
  subscribeToAssets(
    callback: (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => Promise<void>
  ): void {
    const manager = this.getSubscriptionManager();
    manager.subscribe('assets', async (payload) => {
      await callback({
        eventType: payload.eventType,
        new: payload.new as Record<string, unknown>,
        old: payload.old as Record<string, unknown>,
      });
    });
  }

  /**
   * Subscribe to fund_flows for liquidity monitoring
   */
  subscribeToFlows(
    callback: (payload: {
      eventType: string;
      new: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => Promise<void>
  ): void {
    const manager = this.getSubscriptionManager();
    manager.subscribe('fund_flows', async (payload) => {
      await callback({
        eventType: payload.eventType,
        new: payload.new as Record<string, unknown>,
        old: payload.old as Record<string, unknown>,
      });
    });
  }

  /**
   * Route events to appropriate Mastra agents
   */
  async routeEventToAgent(
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    return withErrorHandling(
      async () => {
        if (!this.mastra) {
          throw new Error('Mastra instance not set on SupabaseRealtimeIntegration');
        }

        const agentName = this.agentMap[eventType];
        if (!agentName) {
          this.logger.warn('No agent mapped for event type', { eventType });
          return;
        }

        const agent = this.mastra.agents.find((a) => a.name === agentName);
        if (!agent) {
          throw new Error(`Agent not found: ${agentName}`);
        }

        await agent.execute({
          eventType,
          payload,
        });
      },
      { operation: 'route event to agent', eventType }
    );
  }
}

