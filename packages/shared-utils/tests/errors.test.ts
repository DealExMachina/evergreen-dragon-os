import { describe, it, expect } from 'vitest';
import {
  EvergreenError,
  ConfigError,
  SupabaseError,
  DuckDBError,
  TemporalError,
  AgentError,
  ValidationError,
} from '../src/errors';

describe('Error Classes', () => {
  describe('EvergreenError', () => {
    it('should create error with message and code', () => {
      const error = new EvergreenError('Test error', 'TEST_CODE');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('EvergreenError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EvergreenError);
    });

    it('should include context', () => {
      const context = { userId: '123', resourceId: '456' };
      const error = new EvergreenError('Test error', 'TEST_CODE', context);

      expect(error.context).toEqual(context);
    });
  });

  describe('ConfigError', () => {
    it('should create config error', () => {
      const error = new ConfigError('Config test error', { key: 'value' });

      expect(error.message).toBe('Config test error');
      expect(error.code).toBe('CONFIG_ERROR');
      expect(error.name).toBe('ConfigError');
      expect(error.context).toEqual({ key: 'value' });
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });

  describe('SupabaseError', () => {
    it('should create supabase error', () => {
      const error = new SupabaseError('Supabase test error');

      expect(error.message).toBe('Supabase test error');
      expect(error.code).toBe('SUPABASE_ERROR');
      expect(error.name).toBe('SupabaseError');
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });

  describe('DuckDBError', () => {
    it('should create duckdb error', () => {
      const error = new DuckDBError('DuckDB test error');

      expect(error.message).toBe('DuckDB test error');
      expect(error.code).toBe('DUCKDB_ERROR');
      expect(error.name).toBe('DuckDBError');
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });

  describe('TemporalError', () => {
    it('should create temporal error', () => {
      const error = new TemporalError('Temporal test error');

      expect(error.message).toBe('Temporal test error');
      expect(error.code).toBe('TEMPORAL_ERROR');
      expect(error.name).toBe('TemporalError');
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });

  describe('AgentError', () => {
    it('should create agent error', () => {
      const error = new AgentError('Agent test error');

      expect(error.message).toBe('Agent test error');
      expect(error.code).toBe('AGENT_ERROR');
      expect(error.name).toBe('AgentError');
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Validation test error', {
        field: 'email',
        value: 'invalid',
      });

      expect(error.message).toBe('Validation test error');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.name).toBe('ValidationError');
      expect(error.context).toEqual({ field: 'email', value: 'invalid' });
      expect(error).toBeInstanceOf(EvergreenError);
    });
  });
});

