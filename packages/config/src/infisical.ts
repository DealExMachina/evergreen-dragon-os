import { InfisicalConfig } from './schema';

export interface InfisicalSecret {
  key: string;
  value: string;
  environment?: string;
}

export interface InfisicalClient {
  getSecret: (key: string) => Promise<string | undefined>;
  getAllSecrets: () => Promise<Record<string, string>>;
}

/**
 * Creates an Infisical client for fetching secrets.
 * This is a wrapper that can work with the @infisical/sdk or a mock for testing.
 */
export async function createInfisicalClient(
  config: InfisicalConfig
): Promise<InfisicalClient> {
  // Try to dynamically import Infisical SDK
  try {
    const { InfisicalClient: SDKClient } = await import('@infisical/sdk');
    const client = new SDKClient({
      token: config.projectToken,
      siteUrl: config.apiUrl || 'https://app.infisical.com',
    });

    return {
      getSecret: async (key: string): Promise<string | undefined> => {
        const secret = await client.getSecret({
          environment: config.environment,
          path: '/',
          secretName: key,
        });
        return secret?.secretValue;
      },
      getAllSecrets: async (): Promise<Record<string, string>> => {
        const secrets = await client.listSecrets({
          environment: config.environment,
          path: '/',
        });
        const result: Record<string, string> = {};
        for (const secret of secrets || []) {
          if (secret.secretName && secret.secretValue) {
            result[secret.secretName] = secret.secretValue;
          }
        }
        return result;
      },
    };
  } catch (error) {
    // If Infisical SDK is not available, return a no-op client
    // This allows the code to work in environments where Infisical is not configured
    console.warn('Infisical SDK not available, using no-op client:', error);
    return {
      getSecret: async () => undefined,
      getAllSecrets: async () => ({}),
    };
  }
}

/**
 * Fetches secrets from Infisical and returns them as a flat record.
 */
export async function fetchInfisicalSecrets(
  config: InfisicalConfig
): Promise<Record<string, string>> {
  const client = await createInfisicalClient(config);
  return client.getAllSecrets();
}

