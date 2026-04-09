import { S3Client } from '@aws-sdk/client-s3';

import type { AppConfig } from '@/config/env.js';
import type { IStorageProvider } from '@/modules/storage/interfaces/storage.provider.interface.js';
import { S3Provider } from '@/modules/storage/providers/s3.provider.js';

interface ProviderResult {
  provider: IStorageProvider;
  onClose?: () => Promise<void>;
}

export function createStorageProvider(config: AppConfig): ProviderResult {
  switch (config.STORAGE_PROVIDER) {
    case 's3': {
      const client = new S3Client({
        endpoint: config.S3_ENDPOINT,
        region: config.S3_REGION,
        credentials: {
          accessKeyId: config.S3_ACCESS_KEY,
          secretAccessKey: config.S3_SECRET_KEY,
        },
        forcePathStyle: true,
      });

      return {
        provider: new S3Provider(client, config.S3_BUCKET_NAME),
        onClose: async () => client.destroy(),
      };
    }

    case 'gcs':
      throw new Error('GCS provider not implemented yet');

    case 'local':
      throw new Error('Local provider not implemented yet');
  }
}
