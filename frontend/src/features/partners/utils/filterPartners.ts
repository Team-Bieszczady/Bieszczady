import type { Partner } from '../data';
import { normalizeText } from '../../../lib/normalizeText';

export interface PartnerFilters {
  search: string;
  type: string;
  status: string;
  projectId: string;
  agreement: string;
}

export const EMPTY_FILTERS: PartnerFilters = {
  search: '',
  type: '',
  status: '',
  projectId: '',
  agreement: '',
};

export function filterPartners(
  partners: Partner[],
  filters: PartnerFilters,
): Partner[] {
  const search = normalizeText(filters.search);

  return partners.filter((partner) => {
    if (
      search &&
      !normalizeText(
        `${partner.name} ${partner.contactName} ${partner.nip}`,
      ).includes(search)
    ) {
      return false;
    }
    if (filters.type && partner.type !== filters.type) return false;
    if (filters.status && partner.status !== filters.status) return false;
    if (filters.agreement && partner.agreement !== filters.agreement) {
      return false;
    }
    if (
      filters.projectId &&
      !partner.projects.some((project) => project.id === filters.projectId)
    ) {
      return false;
    }
    return true;
  });
}
