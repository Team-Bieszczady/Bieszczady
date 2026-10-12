import { PERSON_STATUS_LABELS } from '../../features/people/constants';
import type { PersonStatus } from '../../features/people/data';

interface StatusPillProps {
  status: PersonStatus;
  size?: 'sm' | 'md';
}

const TONE: Record<PersonStatus, string> = {
  ACTIVE: 'bg-lightGreen text-darkGreen',
  PENDING: 'bg-amber-100 text-amber-700',
  INACTIVE: 'bg-gray-200 text-gray-600',
  DELETED: 'bg-darkRed/10 text-darkRed',
};

const TITLE: Partial<Record<PersonStatus, string>> = {
  PENDING: 'Konto aktywne, użytkownik nie zalogował się jeszcze ani razu',
};

export function StatusPill({ status, size = 'md' }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium ${
        size === 'sm' ? 'px-2 py-1' : 'px-3 py-1'
      } ${TONE[status]}`}
      title={TITLE[status]}
    >
      {PERSON_STATUS_LABELS[status]}
    </span>
  );
}
