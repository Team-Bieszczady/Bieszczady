import { useApiQuery } from '../../../hooks/useApiQuery';
import { useApiMutation } from '../../../hooks/useApiMutation';
import {
  partnersApi,
  type BackendPartner,
  type PartnerBody,
} from '../../../lib/projectsApi';
import type { Partner } from '../data';

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

function toPartner(partner: BackendPartner): Partner {
  return { ...partner, initials: toInitials(partner.name) };
}

function toBody({ projects, ...input }: PartnerInput): PartnerBody {
  return {
    ...input,
    agreementValidUntil: input.agreementValidUntil || null,
    projectIds: projects.map((project) => project.id),
  };
}

export function usePartners() {
  return useApiQuery(PARTNERS_KEY, async (token) =>
    (await partnersApi.list(token)).map(toPartner),
  );
}

export function useSavePartner() {
  return useApiMutation(
    async (token, { id, input }: { id?: string; input: PartnerInput }) =>
      toPartner(
        id
          ? await partnersApi.patch(token, id, toBody(input))
          : await partnersApi.create(token, toBody(input)),
      ),
    { invalidates: [PARTNERS_KEY] },
  );
}

export function useDeletePartner() {
  return useApiMutation((token, id: string) => partnersApi.remove(token, id), {
    invalidates: [PARTNERS_KEY],
  });
}
