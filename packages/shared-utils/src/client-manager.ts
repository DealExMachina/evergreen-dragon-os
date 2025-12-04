import type { Config } from '@evergreen/config';

/**
 * Interface for managing client instances
 */
export interface ClientManager<T> {
  getClient(config?: Config): T;
  setClient(client: T): void;
  reset(): void;
  isInitialized(): boolean;
}

/**
 * Singleton client manager implementation
 * Manages a single instance of a client with lazy initialization
 */
export class SingletonClientManager<T> implements ClientManager<T> {
  private client: T | null = null;
  private factory: (config: Config) => T;

  constructor(factory: (config: Config) => T) {
    this.factory = factory;
  }

  getClient(config?: Config): T {
    if (!this.client && config) {
      this.client = this.factory(config);
    }
    if (!this.client) {
      throw new Error('Client not initialized. Provide config on first call.');
    }
    return this.client;
  }

  setClient(client: T): void {
    this.client = client;
  }

  reset(): void {
    this.client = null;
  }

  isInitialized(): boolean {
    return this.client !== null;
  }
}

