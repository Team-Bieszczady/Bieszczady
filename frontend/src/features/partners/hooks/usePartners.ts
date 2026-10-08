import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MOCK_PARTNERS, type Partner } from '../data';

const PARTNERS_KEY = ['partners'];

export type PartnerInput = Omit<Partner, 'id' | 'initials'>;

function toInitials(name: string): string {
  const initials = name
    .split(/\s+/)
    .filter((word) => /^\p{Lu}/u.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  return initials || name.trim().slice(0, 2).toUpperCase();
}

export function usePartners() {
  return useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: async () => MOCK_PARTNERS,
    staleTime: Infinity,
  });
}

export function useSavePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id?: string;
      input: PartnerInput;
    }) => ({
      ...input,
      id: id ?? crypto.randomUUID(),
      initials: toInitials(input.name),
    }),
    onSuccess: (saved) => {
      queryClient.setQueryData<Partner[]>(PARTNERS_KEY, (partners = []) =>
        partners.some((partner) => partner.id === saved.id)
          ? partners.map((partner) =>
              partner.id === saved.id ? saved : partner,
            )
          : [saved, ...partners],
      );
    },
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => id,
    onSuccess: (id) => {
      queryClient.setQueryData<Partner[]>(PARTNERS_KEY, (partners = []) =>
        partners.filter((partner) => partner.id !== id),
      );
    },
  });
}
