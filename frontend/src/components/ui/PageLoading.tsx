import { Spinner } from './Spinner';

export function PageLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 h-screen px-6 text-center"
    >
      <Spinner variant="dark" size="32" />
      <p className="text-gray-500 text-sm">Ładowanie...</p>
    </div>
  );
}
