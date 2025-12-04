import { NextRequest } from 'next/server';
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import { createClient } from '@supabase/supabase-js';
import { loadConfig } from '@evergreen/config';

const runtime = new CopilotRuntime();

/**
 * CopilotKit API route
 * Connects AG-UI to agents-service via Supabase Realtime
 */
export async function POST(req: NextRequest) {
  try {
    const config = await loadConfig();
    const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

    // Get request body
    const body = await req.json();

    // Forward to agents-service via Supabase function or direct HTTP
    // For now, we'll use Supabase Realtime to trigger agent execution
    const { data, error } = await supabase.functions.invoke('copilotkit-handler', {
      body: {
        message: body.message,
        context: body.context,
        userId: body.userId,
      },
    });

    if (error) {
      throw error;
    }

    // Return response through CopilotKit
    return copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter: {
        // Use Supabase function response
        handleRequest: async () => {
          return {
            response: data.response,
            actions: data.actions,
            state: data.state,
          };
        },
      },
    })(req);
  } catch (error) {
    console.error('CopilotKit handler error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

