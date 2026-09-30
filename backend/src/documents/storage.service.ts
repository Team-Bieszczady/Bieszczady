import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const CONTAINER_NAME = 'documents';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly container: ContainerClient;

  constructor(private readonly config: ConfigService) {
    const client = BlobServiceClient.fromConnectionString(
      this.config.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING'),
    );
    this.container = client.getContainerClient(CONTAINER_NAME);
  }

  async onModuleInit(): Promise<void> {
    await this.container.createIfNotExists();
  }

  async save(key: string, data: Buffer, mimeType: string): Promise<void> {
    await this.container.getBlockBlobClient(key).uploadData(data, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
  }

  async read(key: string): Promise<Buffer> {
    return await this.container.getBlockBlobClient(key).downloadToBuffer();
  }

  async remove(key: string): Promise<void> {
    await this.container.getBlockBlobClient(key).deleteIfExists();
  }
}
