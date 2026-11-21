/**
 * DuckDB connection interface
 * Replaces 'any' type with proper interface
 */
export interface DuckDBConnection {
  /**
   * Execute a query that doesn't return results
   */
  run(query: string, ...params: unknown[]): Promise<void>;

  /**
   * Execute a query and return results
   */
  query<T = unknown>(query: string, ...params: unknown[]): Promise<T[]>;

  /**
   * Close the connection
   */
  close(): Promise<void>;

  /**
   * Direct access to underlying connection's all method (for callback-based usage)
   * Used by query-builder
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all(sql: string, ...params: any[]): void;
}

/**
 * DuckDB database interface
 */
export interface DuckDBDatabase {
  /**
   * Create a new connection
   */
  connect(): DuckDBConnection;

  /**
   * Close the database
   */
  close(): Promise<void>;
}

