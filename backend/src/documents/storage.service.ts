import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

const CONTAINER_NAME = 'documents';

const UNAVAILABLE_MESSAGE =
  'Magazyn plików jest chwilowo niedostępny. Spróbuj ponownie za chwilę';

function isConnectionError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { statusCode, code, name } = error as {
    statusCode?: unknown;
    code?: unknown;
    name?: unknown;
  };
  if (statusCode !== undefined) return false;
  return (
    typeof code === 'string' || name === 'RestError' || name === 'AbortError'
  );
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly container: ContainerClient;
  private containerReady = false;

  constructor(private readonly config: ConfigService) {
    const client = BlobServiceClient.fromConnectionString(
      this.config.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING'),
      { retryOptions: { maxTries: 3, maxRetryDelayInMs: 2000 } },
    );
    this.container = client.getContainerClient(CONTAINER_NAME);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureContainer();
    } catch (error) {
      this.logger.warn(
        `Magazyn plików niedostępny przy starcie: ${(error as Error).message}`,
      );
    }
  }

  async save(key: string, data: Buffer, mimeType: string): Promise<void> {
    await this.guard(async () => {
      await this.ensureContainer();
      await this.container.getBlockBlobClient(key).uploadData(data, {
        blobHTTPHeaders: { blobContentType: mimeType },
      });
    });
  }

  async read(key: string): Promise<Buffer> {
    return this.guard(() =>
      this.container.getBlockBlobClient(key).downloadToBuffer(),
    );
  }

  async remove(key: string): Promise<void> {
    await this.guard(() =>
      this.container.getBlockBlobClient(key).deleteIfExists(),
    );
  }

  private async ensureContainer(): Promise<void> {
    if (this.containerReady) return;
    await this.container.createIfNotExists();
    this.containerReady = true;
  }

  private async guard<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (!isConnectionError(error)) throw error;
      this.logger.error(
        `Błąd połączenia z magazynem plików: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(UNAVAILABLE_MESSAGE);
    }
  }
}
