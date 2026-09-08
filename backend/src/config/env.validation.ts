const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'NODE_ENV',
  'AZURE_STORAGE_CONNECTION_STRING',
];
export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return config;
}
