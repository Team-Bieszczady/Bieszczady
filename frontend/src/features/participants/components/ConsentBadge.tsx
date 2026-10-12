interface ConsentBadgeProps {
  consentAt: string | null;
}

export function ConsentBadge({ consentAt }: ConsentBadgeProps) {
  if (!consentAt) {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
        Brak zgody
      </span>
    );
  }

  const consentDay = new Date(consentAt).toLocaleDateString('pl-PL');

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <span className="inline-flex rounded-full bg-lightGreen px-2.5 py-1 text-xs font-semibold text-darkGreen">
        ✓ Zgoda
      </span>
      <span className="text-[11px] text-gray-400">od {consentDay}</span>
    </span>
  );
}
