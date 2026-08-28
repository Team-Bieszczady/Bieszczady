const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'NODE_ENV'];
export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  return config;
}
