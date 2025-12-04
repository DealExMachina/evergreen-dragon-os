import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { getLogger } from '@evergreen/shared-utils';

/**
 * Realtime subscription callback
 */
export interface RealtimeCallback<T = unknown> {
  (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: T;
    old?: T;
  }): void | Promise<void>;
}

/**
 * Realtime subscription options
 */
export interface RealtimeSubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

/**
 * Manages Supabase Realtime subscriptions
 * Consolidates subscription logic from multiple places
 */
export class RealtimeSubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private logger = getLogger();

  constructor(private client: SupabaseClient) {}

  /**
   * Subscribe to a table with optional filtering
   */
  subscribe<T = unknown>(
    table: string,
    callback: RealtimeCallback<T>,
    options: RealtimeSubscriptionOptions = {}
  ): RealtimeChannel {
    const channelName = `realtime:${table}`;

    // Return existing channel if already subscribed
    if (this.channels.has(channelName)) {
      this.logger.debug('Reusing existing channel', { channelName });
      return this.channels.get(channelName)!;
    }

    this.logger.info('Subscribing to Realtime channel', {
      table,
      event: options.event || '*',
      filter: options.filter,
    });

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: 'public',
          table,
          filter: options.filter,
        },
        async (payload) => {
          this.logger.debug('Realtime event received', {
            table,
            eventType: payload.eventType,
          });

          try {
            await callback({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as T,
              old: payload.old as T,
            });
          } catch (error) {
            this.logger.error('Error in Realtime callback', {
              table,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.logger.info('Subscribed to Realtime channel', { channelName });
        } else if (status === 'CHANNEL_ERROR') {
          this.logger.error('Failed to subscribe to Realtime channel', { channelName });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Unsubscribe from a specific table
   */
  async unsubscribe(table: string): Promise<void> {
    const channelName = `realtime:${table}`;
    const channel = this.channels.get(channelName);

    if (channel) {
      await this.client.removeChannel(channel);
      this.channels.delete(channelName);
      this.logger.info('Unsubscribed from Realtime channel', { channelName });
    }
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    for (const [name, channel] of this.channels) {
      try {
        await this.client.removeChannel(channel);
        this.logger.debug('Removed channel', { name });
      } catch (error) {
        this.logger.warn('Error removing channel', { name, error });
      }
    }
    this.channels.clear();
    this.logger.info('All Realtime subscriptions cleaned up');
  }

  /**
   * Get all active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

