interface FieldErrorProps {
  message?: string;
}

export function FieldError({ message }: FieldErrorProps) {
  return (
    <div className="mt-1 min-h-4" aria-live="polite">
      <p
        className={`text-xs text-red-500 transition duration-200 ease-out ${
          message ? 'translate-y-0 opacity-100' : '-translate-y-0.5 opacity-0'
        }`}
      >
        {message}
      </p>
    </div>
  );
}
