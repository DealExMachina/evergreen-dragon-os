import { getLogger, withErrorHandling } from '@evergreen/shared-utils';
import { Mastra } from '@mastra/core';
import { SupabaseRealtimeIntegration } from './supabase-realtime';

/**
 * CopilotKit bridge for connecting AG-UI to Mastra agents
 * Handles bidirectional communication between UI and agents
 */
export class CopilotKitBridge {
  private mastra: Mastra;
  private supabaseRealtime: SupabaseRealtimeIntegration;
  private logger = getLogger();

  constructor(mastra: Mastra, supabaseRealtime: SupabaseRealtimeIntegration) {
    this.mastra = mastra;
    this.supabaseRealtime = supabaseRealtime;
  }

  /**
   * Handle CopilotKit request from AG-UI
   * Routes to appropriate Mastra agent
   */
  async handleCopilotRequest(request: {
    message: string;
    context?: Record<string, unknown>;
    userId?: string;
  }): Promise<{
    response: string;
    actions?: Array<{ type: string; payload: unknown }>;
    state?: Record<string, unknown>;
  }> {
    return withErrorHandling(
      async () => {
        const commander = this.mastra.agents.find((a) => a.name === 'commander');
        if (!commander) {
          throw new Error('Commander agent not found');
        }

        const result = await commander.execute({
          request: request.message,
          context: request.context,
          userId: request.userId,
        });

        return {
          response: typeof result === 'string' ? result : JSON.stringify(result),
          actions: this.extractActions(result),
          state: this.extractState(result),
        };
      },
      { operation: 'handle CopilotKit request', userId: request.userId }
    );
  }

  /**
   * Push agent state update to AG-UI via Supabase Realtime
   */
  async pushStateUpdate(
    userId: string,
    state: Record<string, unknown>
  ): Promise<void> {
    return withErrorHandling(
      async () => {
        const supabase = this.supabaseRealtime.getClient();

        // Store state in Supabase for Realtime broadcast
        const { error } = await supabase.from('agent_state').upsert({
          user_id: userId,
          state,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          throw error;
        }
      },
      { operation: 'push state update', userId }
    );
  }

  /**
   * Subscribe to user-specific state changes
   */
  subscribeToUserState(
    userId: string,
    callback: (state: Record<string, unknown>) => void
  ): void {
    const supabase = this.supabaseRealtime.getClient();

    supabase
      .channel(`user-state-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agent_state',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback((payload.new as any).state);
        }
      )
      .subscribe();
  }

  /**
   * Extract actionable items from agent response
   */
  private extractActions(result: unknown): Array<{ type: string; payload: unknown }> {
    // TODO: Parse agent response for actionable items
    // This would identify workflow triggers, approvals needed, etc.
    if (typeof result === 'object' && result !== null && 'actions' in result) {
      return (result as any).actions;
    }
    return [];
  }

  /**
   * Extract state updates from agent response
   */
  private extractState(result: unknown): Record<string, unknown> {
    // TODO: Parse agent response for state updates
    if (typeof result === 'object' && result !== null && 'state' in result) {
      return (result as any).state;
    }
    return {};
  }
}

