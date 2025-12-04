import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { Config } from '@evergreen/config';
import { BaseIntegration, withErrorHandling } from '@evergreen/shared-utils';
import type { DocumentStorage } from './contracts';

/**
 * S3 integration for document storage and DuckDB snapshots
 * Uses Supabase Storage (S3-compatible) or AWS S3
 */
export class S3StorageIntegration extends BaseIntegration implements DocumentStorage {
  private client: S3Client | null = null;
  private bucket: string;

  constructor(bucket: string) {
    super();
    this.bucket = bucket;
  }

  /**
   * Initialize S3 client
   */
  protected async doInitialize(config: Config): Promise<void> {
    // Check if using Supabase Storage (S3-compatible) or AWS S3
    const s3Endpoint = process.env.S3_ENDPOINT || process.env.SUPABASE_STORAGE_ENDPOINT;
    const s3Region = process.env.S3_REGION || 'us-east-1';
    const s3AccessKey = process.env.S3_ACCESS_KEY_ID || process.env.SUPABASE_STORAGE_ACCESS_KEY;
    const s3SecretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.SUPABASE_STORAGE_SECRET_KEY;

    this.client = new S3Client({
      region: s3Region,
      endpoint: s3Endpoint,
      credentials: s3AccessKey && s3SecretKey
        ? {
            accessKeyId: s3AccessKey,
            secretAccessKey: s3SecretKey,
          }
        : undefined,
      forcePathStyle: !!s3Endpoint, // Required for Supabase Storage
    });
  }

  /**
   * Cleanup S3 client
   */
  protected async doCleanup(): Promise<void> {
    // S3Client doesn't require explicit cleanup
    this.client = null;
  }

  /**
   * Get S3 client (throws if not initialized)
   */
  private getClient(): S3Client {
    if (!this.client) {
      throw new Error('S3 client not initialized');
    }
    return this.client;
  }

  /**
   * Upload document to S3
   */
  async uploadDocument(
    key: string,
    content: Buffer | string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const client = this.getClient();

    return withErrorHandling(
      async () => {
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: typeof content === 'string' ? Buffer.from(content) : content,
          ContentType: contentType || 'application/octet-stream',
          Metadata: metadata,
        });

        await client.send(command);
        return key;
      },
      { operation: 'upload document to S3', key, bucket: this.bucket }
    );
  }

  /**
   * Download document from S3
   */
  async downloadDocument(key: string): Promise<Buffer> {
    const client = this.getClient();

    return withErrorHandling(
      async () => {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        const response = await client.send(command);
        const chunks: Uint8Array[] = [];

        if (response.Body) {
          for await (const chunk of response.Body as any) {
            chunks.push(chunk);
          }
        }

        return Buffer.concat(chunks);
      },
      { operation: 'download document from S3', key, bucket: this.bucket }
    );
  }

  /**
   * Upload DuckDB snapshot
   */
  async uploadDuckDBSnapshot(snapshotId: string, dbPath: string): Promise<string> {
    return withErrorHandling(
      async () => {
        const fs = await import('fs/promises');
        const dbContent = await fs.readFile(dbPath);

        const key = `duckdb-snapshots/${snapshotId}.duckdb`;
        await this.uploadDocument(key, dbContent, 'application/x-duckdb', {
          snapshotId,
          timestamp: new Date().toISOString(),
        });

        return key;
      },
      { operation: 'upload DuckDB snapshot', snapshotId, dbPath }
    );
  }

  /**
   * List documents in a prefix
   */
  async listDocuments(prefix: string): Promise<string[]> {
    const client = this.getClient();

    return withErrorHandling(
      async () => {
        const command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        });

        const response = await client.send(command);
        return (response.Contents || []).map((obj) => obj.Key || '').filter(Boolean);
      },
      { operation: 'list documents in S3', prefix, bucket: this.bucket }
    );
  }

  /**
   * Generate presigned URL for document access (for AG-UI)
   */
  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return withErrorHandling(
      async () => {
        // TODO: Implement presigned URL generation
        // This would use @aws-sdk/s3-request-presigner
        // For Supabase Storage, use Supabase client's getPublicUrl or createSignedUrl
        return `https://${this.bucket}/${key}`;
      },
      { operation: 'get presigned URL', key, expiresIn }
    );
  }
}

