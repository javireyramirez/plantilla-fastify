import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

import type { IStorageProvider } from '@/modules/storage/interfaces/storage.provider.interface.js';

export class S3Provider implements IStorageProvider {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
  ) {}

  async generateUploadUrl(key: string, contentType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 },
    );
  }

  async generateDownloadUrl(
    key: string,
    fileName: string,
    mode: 'view' | 'download',
  ): Promise<string> {
    const disposition =
      mode === 'download' ? `attachment; filename="${fileName}"` : `inline; filename="${fileName}"`;

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentDisposition: disposition,
      }),
      { expiresIn: 3600 },
    );
  }

  async checkFileExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deleteFiles(keys: string[]): Promise<void> {
    const limit = 1000;

    for (let i = 0; i < keys.length; i += limit) {
      const chunk = keys.slice(i, i + limit);

      const command = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });

      await this.client.send(command);
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    const response = await this.client.send(command);
    return response.Body as Readable;
  }
}
