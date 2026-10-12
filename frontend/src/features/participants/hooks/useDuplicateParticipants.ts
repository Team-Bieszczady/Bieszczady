import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { api } from '../../../lib/api';
import { EMAIL_PATTERN } from '../validation';

const DEBOUNCE_MS = 400;
const MIN_NAME_LENGTH = 2;

interface DuplicateCheckInputs {
  firstName: string;
  lastName: string;
  email: string;
  excludeId?: string;
}

export function useDuplicateParticipants({
  firstName,
  lastName,
  email,
  excludeId,
}: DuplicateCheckInputs) {
  const { hasToken, requireToken } = useAuthToken();

  const debouncedFirstName = useDebouncedValue(firstName.trim(), DEBOUNCE_MS);
  const debouncedLastName = useDebouncedValue(lastName.trim(), DEBOUNCE_MS);
  const debouncedEmail = useDebouncedValue(email.trim(), DEBOUNCE_MS);

  const hasFullName =
    debouncedFirstName.length >= MIN_NAME_LENGTH &&
    debouncedLastName.length >= MIN_NAME_LENGTH;
  const hasValidEmail = EMAIL_PATTERN.test(debouncedEmail);

  return useQuery({
    queryKey: [
      'participants',
      'duplicates',
      debouncedFirstName,
      debouncedLastName,
      debouncedEmail,
      excludeId,
    ],
    queryFn: () =>
      api.getDuplicateParticipants(requireToken(), {
        firstName: hasFullName ? debouncedFirstName : undefined,
        lastName: hasFullName ? debouncedLastName : undefined,
        email: hasValidEmail ? debouncedEmail : undefined,
        excludeId,
      }),
    enabled: hasToken && (hasFullName || hasValidEmail),
  });
}
