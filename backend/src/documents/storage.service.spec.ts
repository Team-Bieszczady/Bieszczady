import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const createIfNotExists = jest.fn();
const uploadData = jest.fn();
const downloadToBuffer = jest.fn();
const deleteIfExists = jest.fn();

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: () => ({
      getContainerClient: () => ({
        createIfNotExists,
        getBlockBlobClient: () => ({
          uploadData,
          downloadToBuffer,
          deleteIfExists,
        }),
      }),
    }),
  },
}));

const refused = () =>
  Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:10000'), {
    name: 'RestError',
    code: 'ECONNREFUSED',
  });

describe('StorageService when storage is unreachable', () => {
  let storage: StorageService;

  beforeEach(() => {
    jest.resetAllMocks();
    storage = new StorageService({
      getOrThrow: () => 'UseDevelopmentStorage=true',
    } as unknown as ConfigService);
  });

  it('still lets the app boot', async () => {
    createIfNotExists.mockRejectedValue(refused());

    await expect(storage.onModuleInit()).resolves.toBeUndefined();
  });

  it('answers an upload with a 503, not a crash', async () => {
    createIfNotExists.mockRejectedValue(refused());

    await expect(
      storage.save('k', Buffer.from('x'), 'text/plain'),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('answers a download with a 503', async () => {
    downloadToBuffer.mockRejectedValue(refused());

    await expect(storage.read('k')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('creates the container lazily once storage is back', async () => {
    createIfNotExists.mockRejectedValueOnce(refused());
    await storage.onModuleInit();

    createIfNotExists.mockResolvedValue({});
    uploadData.mockResolvedValue({});
    await storage.save('k', Buffer.from('x'), 'text/plain');

    expect(createIfNotExists).toHaveBeenCalledTimes(2);
    expect(uploadData).toHaveBeenCalled();
  });

  it('passes an HTTP error from the service through unchanged', async () => {
    const notFound = Object.assign(new Error('BlobNotFound'), {
      name: 'RestError',
      statusCode: 404,
    });
    downloadToBuffer.mockRejectedValue(notFound);

    await expect(storage.read('k')).rejects.toBe(notFound);
  });
});
