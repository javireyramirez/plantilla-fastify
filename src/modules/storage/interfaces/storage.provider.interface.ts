import { Readable } from 'stream';

export interface IStorageProvider {
  generateUploadUrl(key: string, contentType: string): Promise<string>;
  generateDownloadUrl(key: string, fileName: string, mode: 'view' | 'download'): Promise<string>;
  checkFileExists(key: string): Promise<boolean>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(key: string[]): Promise<void>;
  getFileStream(key: string): Promise<Readable>;
}
