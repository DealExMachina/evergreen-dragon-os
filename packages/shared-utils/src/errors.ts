/**
 * Base error class for Evergreen Dragon OS
 */
export class EvergreenError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EvergreenError';
    Object.setPrototypeOf(this, EvergreenError.prototype);
  }
}

/**
 * Configuration-related errors
 */
export class ConfigError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

/**
 * Supabase-related errors
 */
export class SupabaseError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'SUPABASE_ERROR', context);
    this.name = 'SupabaseError';
    Object.setPrototypeOf(this, SupabaseError.prototype);
  }
}

/**
 * DuckDB-related errors
 */
export class DuckDBError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DUCKDB_ERROR', context);
    this.name = 'DuckDBError';
    Object.setPrototypeOf(this, DuckDBError.prototype);
  }
}

/**
 * Temporal workflow errors
 */
export class TemporalError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TEMPORAL_ERROR', context);
    this.name = 'TemporalError';
    Object.setPrototypeOf(this, TemporalError.prototype);
  }
}

/**
 * Agent-related errors
 */
export class AgentError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AGENT_ERROR', context);
    this.name = 'AgentError';
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends EvergreenError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

