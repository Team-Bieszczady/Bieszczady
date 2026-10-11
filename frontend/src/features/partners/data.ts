export type PartnerStatus = 'ACTIVE' | 'PAUSED';

export interface PartnerProject {
  id: string;
  name: string;
}

export interface Partner {
  id: string;
  name: string;
  initials: string;
  type: string;
  nip: string;
  city: string;
  email: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  projects: PartnerProject[];
  agreement: string;
  agreementValidUntil: string;
  status: PartnerStatus;
}
