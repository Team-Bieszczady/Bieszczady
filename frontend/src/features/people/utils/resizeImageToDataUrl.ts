const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 256;
const MAX_DATA_URL_LENGTH = 120_000;
const QUALITY_LADDER = [0.82, 0.7, 0.6];

export class ImageTooLargeError extends Error {}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Nie udało się odczytać obrazu'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function resizeImageToDataUrl(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Dozwolone formaty to JPG, PNG i WebP.');
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new ImageTooLargeError('Zdjęcie może mieć maksymalnie 5 MB.');
  }

  const source = await decode(file);
  const width = source.width;
  const height = source.height;

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nie udało się przetworzyć zdjęcia.');
  ctx.imageSmoothingQuality = 'high';

  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  ctx.drawImage(source, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  if ('close' in source) source.close();

  for (const quality of QUALITY_LADDER) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= MAX_DATA_URL_LENGTH) return dataUrl;
  }

  throw new ImageTooLargeError('Zdjęcie jest zbyt duże. Wybierz inne.');
}
