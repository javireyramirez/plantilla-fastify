export interface IStorageProvider {
  generateUploadUrl(key: string, contentType: string): Promise<string>;
  generateDownloadUrl(key: string): Promise<string>;
  checkFileExists(key: string): Promise<boolean>;
  deleteFile(key: string): Promise<void>;
  deleteFiles(key: string[]): Promise<void>;
}
