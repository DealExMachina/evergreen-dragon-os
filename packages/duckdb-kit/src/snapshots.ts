import type { DuckDBConnectionManager } from './connection';
import { getLogger } from '@evergreen/shared-utils';
import { DuckDBError } from '@evergreen/shared-utils';
import * as fs from 'fs';
import * as path from 'path';

export interface SnapshotOptions {
  format?: 'parquet' | 'csv' | 'json';
  compression?: 'gzip' | 'snappy' | 'zstd';
  includeMetadata?: boolean;
}

/**
 * Handles DuckDB snapshots and exports
 */
export class SnapshotManager {
  constructor(private connectionManager: DuckDBConnectionManager) {}

  /**
   * Creates a snapshot of a table or query result
   */
  async createSnapshot(
    source: string,
    outputPath: string,
    options: SnapshotOptions = {}
  ): Promise<void> {
    const logger = getLogger();
    const format = options.format || 'parquet';
    const compression = options.compression || 'snappy';

    logger.info(`Creating snapshot: ${source} -> ${outputPath}`, { format, compression });

    try {
      const connection = this.connectionManager.getConnection();

      // Build export query
      let exportQuery: string;
      if (source.toUpperCase().startsWith('SELECT')) {
        // Source is a query
        exportQuery = `COPY (${source}) TO '${outputPath}' (FORMAT ${format.toUpperCase()}`;
      } else {
        // Source is a table
        exportQuery = `COPY ${source} TO '${outputPath}' (FORMAT ${format.toUpperCase()}`;
      }

      if (compression) {
        exportQuery += `, COMPRESSION ${compression.toUpperCase()}`;
      }

      exportQuery += ')';

      await new Promise<void>((resolve, reject) => {
        connection.run(exportQuery, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Add metadata if requested
      if (options.includeMetadata) {
        await this.addMetadata(outputPath, source, format);
      }

      logger.info(`Snapshot created successfully: ${outputPath}`);
    } catch (error) {
      logger.error('Failed to create snapshot', { error, source, outputPath });
      throw new DuckDBError('Failed to create snapshot', {
        source,
        outputPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Restores a snapshot into a table
   */
  async restoreSnapshot(
    snapshotPath: string,
    targetTable: string,
    format?: 'parquet' | 'csv' | 'json'
  ): Promise<void> {
    const logger = getLogger();
    const detectedFormat = format || this.detectFormat(snapshotPath);

    logger.info(`Restoring snapshot: ${snapshotPath} -> ${targetTable}`, { format: detectedFormat });

    try {
      const connection = this.connectionManager.getConnection();

      // Drop table if exists
      await new Promise<void>((resolve, reject) => {
        connection.run(`DROP TABLE IF EXISTS ${targetTable}`, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Import snapshot
      const importQuery = `COPY ${targetTable} FROM '${snapshotPath}' (FORMAT ${detectedFormat.toUpperCase()})`;

      await new Promise<void>((resolve, reject) => {
        connection.run(importQuery, (err: Error | null) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      logger.info(`Snapshot restored successfully: ${targetTable}`);
    } catch (error) {
      logger.error('Failed to restore snapshot', { error, snapshotPath, targetTable });
      throw new DuckDBError('Failed to restore snapshot', {
        snapshotPath,
        targetTable,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Exports snapshot to S3
   */
  async exportToS3(
    source: string,
    s3Path: string,
    options: SnapshotOptions = {}
  ): Promise<void> {
    const logger = getLogger();
    logger.info(`Exporting snapshot to S3: ${source} -> ${s3Path}`);

    // Create local snapshot first
    const tempPath = path.join(process.cwd(), 'temp', `snapshot-${Date.now()}.parquet`);
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      await this.createSnapshot(source, tempPath, options);

      // Upload to S3 (requires AWS SDK)
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const connectionManager = (this.connectionManager as any);
      const config = connectionManager.config;

      const match = s3Path.match(/^s3:\/\/([^/]+)\/(.+)$/);
      if (!match) {
        throw new DuckDBError('Invalid S3 path format', { path: s3Path });
      }

      const [, bucket, key] = match;

      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: config.duckdb.s3AccessKey
          ? {
              accessKeyId: config.duckdb.s3AccessKey,
              secretAccessKey: config.duckdb.s3SecretKey || '',
            }
          : undefined,
      });

      const fileContent = fs.readFileSync(tempPath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileContent,
        })
      );

      logger.info(`Snapshot exported to S3: ${s3Path}`);

      // Clean up temp file
      fs.unlinkSync(tempPath);
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  /**
   * Detects file format from extension
   */
  private detectFormat(filePath: string): 'parquet' | 'csv' | 'json' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.parquet':
        return 'parquet';
      case '.csv':
        return 'csv';
      case '.json':
        return 'json';
      default:
        return 'parquet'; // Default
    }
  }

  /**
   * Adds metadata file alongside snapshot
   */
  private async addMetadata(
    snapshotPath: string,
    source: string,
    format: string
  ): Promise<void> {
    const metadataPath = `${snapshotPath}.metadata.json`;
    const metadata = {
      source,
      format,
      createdAt: new Date().toISOString(),
      version: '1.0',
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }
}

