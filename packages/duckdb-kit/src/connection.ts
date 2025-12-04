import { Database } from 'duckdb';
import type { Config } from '@evergreen/config';
import { getLogger } from '@evergreen/shared-utils';
import { DuckDBError } from '@evergreen/shared-utils';
import type { DuckDBConnection, DuckDBDatabase } from './types';
import * as fs from 'fs';
import * as path from 'path';

export interface DuckDBConnectionOptions {
  path: string;
  readOnly?: boolean;
  accessMode?: 'READ_ONLY' | 'READ_WRITE';
}

/**
 * Manages DuckDB database connections
 */
export class DuckDBConnectionManager {
  private db: Database | null = null;
  private connection: DuckDBConnection | null = null;
  private config: Config;
  private logger = getLogger();

  constructor(config: Config) {
    this.config = config;
  }

  /**
   * Connects to DuckDB database (local file or S3)
   */
  async connect(options?: Partial<DuckDBConnectionOptions>): Promise<void> {
    const dbPath = options?.path || this.config.duckdb.path;
    const readOnly = options?.readOnly ?? false;

    try {
      // Handle S3 paths
      if (dbPath.startsWith('s3://')) {
        await this.connectToS3(dbPath);
        return;
      }

      // Handle local file paths
      const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
      
      // Ensure directory exists for write mode
      if (!readOnly) {
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      this.logger.info(`Connecting to DuckDB at ${absolutePath}`, { readOnly });

      this.db = new Database(absolutePath, { access_mode: readOnly ? 'READ_ONLY' : 'READ_WRITE' });
      this.connection = this.db.connect();

      // Configure connection settings
      await this.configureConnection();

      this.logger.info('DuckDB connection established');
    } catch (error) {
      this.logger.error('Failed to connect to DuckDB', error);
      throw new DuckDBError('Failed to connect to DuckDB', {
        path: dbPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Connects to DuckDB database stored in S3
   */
  private async connectToS3(s3Path: string): Promise<void> {
    // S3 connection requires AWS SDK
    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      
      // Parse S3 path: s3://bucket/path/to/file.duckdb
      const match = s3Path.match(/^s3:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        throw new DuckDBError('Invalid S3 path format', { path: s3Path });
      }

      const [, bucket, key] = match;

      // Configure AWS credentials from config
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: this.config.duckdb.s3AccessKey
          ? {
              accessKeyId: this.config.duckdb.s3AccessKey,
              secretAccessKey: this.config.duckdb.s3SecretKey || '',
            }
          : undefined,
      });

      this.logger.info(`Connecting to DuckDB in S3: ${bucket}/${key}`);

      // DuckDB can mount S3 as a filesystem
      // This is a simplified version - in production, you'd use DuckDB's S3 extension
      this.db = new Database(':memory:'); // Start with in-memory
      this.connection = this.db.connect();

      // Install and load httpfs extension for S3 support
      await this.connection.run("INSTALL httpfs;");
      await this.connection.run("LOAD httpfs;");

      // Configure S3 credentials
      if (this.config.duckdb.s3AccessKey && this.config.duckdb.s3SecretKey) {
        await this.connection.run(
          `SET s3_region='${process.env.AWS_REGION || 'us-east-1'}';`
        );
        await this.connection.run(
          `SET s3_access_key_id='${this.config.duckdb.s3AccessKey}';`
        );
        await this.connection.run(
          `SET s3_secret_access_key='${this.config.duckdb.s3SecretKey}';`
        );
      }

      // Attach S3 database
      await this.connection.run(`ATTACH '${s3Path}' AS s3_db (TYPE S3);`);

      this.logger.info('DuckDB S3 connection established');
    } catch (error) {
      this.logger.error('Failed to connect to DuckDB in S3', error);
      throw new DuckDBError('Failed to connect to DuckDB in S3', {
        path: s3Path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Configures connection settings
   */
  private async configureConnection(): Promise<void> {
    if (!this.connection) {
      throw new DuckDBError('Connection not established');
    }

    // Set memory limit (adjust based on needs)
    await this.connection.run("SET memory_limit='2GB';");
    
    // Enable parallel execution
    await this.connection.run("SET threads=4;");
    
    // Set timezone
    await this.connection.run("SET timezone='UTC';");
  }

  /**
   * Gets the active connection
   */
  getConnection(): DuckDBConnection {
    if (!this.connection) {
      throw new DuckDBError('Connection not established. Call connect() first.');
    }
    return this.connection;
  }

  /**
   * Gets the database instance
   */
  getDatabase(): DuckDBDatabase {
    if (!this.db) {
      throw new DuckDBError('Database not initialized. Call connect() first.');
    }
    return this.db as unknown as DuckDBDatabase;
  }

  /**
   * Closes the connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
      } catch (error) {
        this.logger.warn('Error closing DuckDB connection', { error });
      }
    }

    if (this.db) {
      try {
        await this.db.close();
        this.db = null;
        this.logger.info('DuckDB connection closed');
      } catch (error) {
        this.logger.warn('Error closing DuckDB database', { error });
      }
    }
  }

  /**
   * Checks if connection is active
   */
  isConnected(): boolean {
    return this.connection !== null && this.db !== null;
  }
}

import { SingletonClientManager } from '@evergreen/shared-utils';

/**
 * DuckDB connection manager using singleton pattern
 */
export const duckDBConnectionManager = new SingletonClientManager<DuckDBConnectionManager>(
  (config) => new DuckDBConnectionManager(config)
);

/**
 * Gets or creates the global DuckDB connection manager
 */
export function getDuckDBConnectionManager(config?: Config): DuckDBConnectionManager {
  return duckDBConnectionManager.getClient(config);
}

/**
 * Sets the global DuckDB connection manager (useful for testing)
 */
export function setDuckDBConnectionManager(manager: DuckDBConnectionManager): void {
  duckDBConnectionManager.setClient(manager);
}

/**
 * Resets the DuckDB connection manager (useful for testing)
 */
export function resetDuckDBConnectionManager(): void {
  duckDBConnectionManager.reset();
}

