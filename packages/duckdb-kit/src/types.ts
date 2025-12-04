/**
 * DuckDB connection interface
 * Replaces 'any' type with proper interface
 */
export interface DuckDBConnection {
  /**
   * Execute a query that doesn't return results
   */
  run(query: string): Promise<void>;

  /**
   * Execute a query and return results
   */
  query<T = unknown>(query: string): Promise<T[]>;

  /**
   * Close the connection
   */
  close(): Promise<void>;
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

