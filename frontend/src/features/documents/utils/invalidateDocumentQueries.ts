import type { QueryClient } from '@tanstack/react-query';

const DOCUMENT_QUERIES = [
  'documents',
  'pending-documents',
  'pending-count',
  'folders',
  'trash',
  'versions',
];

export function invalidateDocumentQueries(
  queryClient: QueryClient,
  projectId: string,
) {
  for (const key of DOCUMENT_QUERIES) {
    void queryClient.invalidateQueries({ queryKey: [key, projectId] });
  }
}
