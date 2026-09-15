export type ActionFailure = { ok: false; message: string };

export function failure(error: unknown, fallback: string): ActionFailure {
  return {
    ok: false,
    message: error instanceof Error ? error.message : fallback,
  };
}
