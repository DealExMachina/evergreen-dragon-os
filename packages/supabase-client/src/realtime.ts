import type { SupabaseClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getLogger } from '@evergreen/shared-utils';

export interface RealtimeSubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

export interface RealtimeCallback<T = unknown> {
  (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: T;
    old?: T;
    errors?: Error[];
  }): void;
}

/**
 * Subscribes to Supabase Realtime changes for a table
 */
export function subscribeToTable<T = unknown>(
  client: SupabaseClient,
  table: string,
  callback: RealtimeCallback<T>,
  options: RealtimeSubscriptionOptions = {}
): RealtimeChannel {
  const logger = getLogger();
  return client
    .channel(`realtime:${table}`)

    .on(
      'postgres_changes' as any,
      {
        event: options.event || '*',
        schema: 'public',
        table: table,
        filter: options.filter,
      } as any,
      (payload: any) => {
        logger.debug(`Realtime event on ${table}`, {
          eventType: payload.eventType,
          table,
        });

        callback({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as T,
          old: payload.old as T,
          errors: payload.errors,
        });
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        logger.info(`Subscribed to Realtime channel: ${table}`);
      } else if (status === 'CHANNEL_ERROR') {
        logger.error(`Failed to subscribe to Realtime channel: ${table}`);
      }
    });
}

/**
 * Subscribes to fund_events table specifically
 */
export function subscribeToFundEvents(
  client: SupabaseClient,
  callback: RealtimeCallback,
  eventType?: string
): RealtimeChannel {
  return subscribeToTable(
    client,
    'fund_events',
    callback,
    eventType ? { event: eventType as any, filter: `type=eq.${eventType}` } : {}
  );
}

/**
 * Unsubscribes from a Realtime channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
  await channel.unsubscribe();
  const logger = getLogger();
  logger.info(`Unsubscribed from channel: ${channel.topic}`);
}
