import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SingletonClientManager } from '../src/client-manager';
import { createMockConfig } from '@tests/fixtures';

describe('SingletonClientManager', () => {
  let manager: SingletonClientManager<string>;
  let factory: (config: any) => string;

  beforeEach(() => {
    factory = vi.fn((config) => `client-${config.environment}`);
    manager = new SingletonClientManager(factory);
  });

  it('should create client on first getClient call with config', () => {
    const config = createMockConfig();
    const client = manager.getClient(config);

    expect(client).toBe('client-test');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith(config);
  });

  it('should return same client on subsequent calls', () => {
    const config = createMockConfig();
    const client1 = manager.getClient(config);
    const client2 = manager.getClient();

    expect(client1).toBe(client2);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should throw error if getClient called without config before initialization', () => {
    expect(() => manager.getClient()).toThrow('Client not initialized');
  });

  it('should allow setting client directly', () => {
    const customClient = 'custom-client';
    manager.setClient(customClient);

    expect(manager.getClient()).toBe(customClient);
    expect(factory).not.toHaveBeenCalled();
  });

  it('should reset client', () => {
    const config = createMockConfig();
    manager.getClient(config);
    expect(manager.isInitialized()).toBe(true);

    manager.reset();
    expect(manager.isInitialized()).toBe(false);
    expect(() => manager.getClient()).toThrow('Client not initialized');
  });

  it('should correctly report initialization status', () => {
    expect(manager.isInitialized()).toBe(false);

    const config = createMockConfig();
    manager.getClient(config);
    expect(manager.isInitialized()).toBe(true);

    manager.reset();
    expect(manager.isInitialized()).toBe(false);
  });
});

