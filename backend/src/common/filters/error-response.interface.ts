export interface ErrorResponse {
  code: string;
  message: string;
  fields: Record<string, string[]> | null;
}
