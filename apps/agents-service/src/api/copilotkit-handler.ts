import type { Request, Response } from 'express';
import { getLogger } from '@evergreen/shared-utils';
import type { MastraIntegrationContext } from '../mastra';

/**
 * HTTP handler for CopilotKit requests
 * This would be called from Supabase Edge Function or Express server
 */
export async function handleCopilotKitRequest(
  req: Request,
  res: Response,
  integrationContext: MastraIntegrationContext
): Promise<void> {
  const logger = getLogger();

  try {
    const { message, context, userId } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    logger.info('Handling CopilotKit request', { message, userId });

    // Route to CopilotKit bridge
    const result = await integrationContext.copilotKit.handleCopilotRequest({
      message,
      context,
      userId,
    });

    // Push state update if provided
    if (result.state && userId) {
      await integrationContext.copilotKit.pushStateUpdate(userId, result.state);
    }

    res.json(result);
  } catch (error) {
    logger.error('Failed to handle CopilotKit request', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
}

