import { Button } from './Button';

interface PageMessageProps {
  message: string;
  onRetry?: () => void;
}

export function PageMessage({ message, onRetry }: PageMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen px-6 text-center">
      <p className="text-gray-500 text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="compact" onClick={onRetry}>
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}
