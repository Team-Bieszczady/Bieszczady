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

const BIKE_TRAIL = {
  id: 'mock-bike-trail',
  name: 'Szlak rowerowy Solina–Myczkowce',
};
const BOJKO_FESTIVAL = {
  id: 'mock-bojko-festival',
  name: 'Festiwal Kultury Bojkowskiej',
};
const SEWAGE_PLANT = {
  id: 'mock-sewage-plant',
  name: 'Modernizacja oczyszczalni ścieków',
};
const EDUCATION_PATH = {
  id: 'mock-education-path',
  name: 'Ścieżka edukacyjna Połonina',
};
const HERB_WORKSHOPS = { id: 'mock-herb-workshops', name: 'Warsztaty ziołowe' };

export const MOCK_PARTNERS: Partner[] = [
  {
    id: 'partner-1',
    name: 'Fundacja Bieszczadzka',
    initials: 'FB',
    type: 'Fundacja',
    nip: '689-11-22-333',
    city: 'Ustrzyki Dolne',
    email: 'biuro@fundacja.pl',
    contactName: 'Maria Zielińska',
    contactEmail: 'm.zielinska@fundacja.pl',
    contactPhone: '+48 601 234 567',
    projects: [BIKE_TRAIL, EDUCATION_PATH],
    agreement: 'Umowa partnerska',
    agreementValidUntil: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: 'partner-2',
    name: 'Gmina Lutowiska',
    initials: 'GL',
    type: 'Samorząd',
    nip: '688-10-04-521',
    city: 'Lutowiska',
    email: 'sekretariat@lutowiska.pl',
    contactName: 'Tomasz Hnat',
    contactEmail: 't.hnat@lutowiska.pl',
    contactPhone: '+48 13 461 00 01',
    projects: [BOJKO_FESTIVAL],
    agreement: 'Porozumienie',
    agreementValidUntil: '',
    status: 'ACTIVE',
  },
  {
    id: 'partner-3',
    name: 'Nadleśnictwo Ustrzyki Dolne',
    initials: 'NU',
    type: 'Instytucja publiczna',
    nip: '',
    city: 'Ustrzyki Dolne',
    email: 'ustrzyki@krosno.lasy.gov.pl',
    contactName: 'Piotr Sawicki',
    contactEmail: 'p.sawicki@krosno.lasy.gov.pl',
    contactPhone: '+48 13 461 13 10',
    projects: [BIKE_TRAIL],
    agreement: 'List intencyjny',
    agreementValidUntil: '2026-11-30',
    status: 'ACTIVE',
  },
  {
    id: 'partner-4',
    name: 'LGD Zielone Bieszczady',
    initials: 'ZB',
    type: 'Stowarzyszenie',
    nip: '689-12-33-771',
    city: 'Lesko',
    email: 'biuro@zielonebieszczady.pl',
    contactName: 'Anna Kowalska',
    contactEmail: 'biuro@zielonebieszczady.pl',
    contactPhone: '+48 604 555 120',
    projects: [SEWAGE_PLANT, BIKE_TRAIL, BOJKO_FESTIVAL],
    agreement: 'Umowa partnerska',
    agreementValidUntil: '2027-06-30',
    status: 'ACTIVE',
  },
  {
    id: 'partner-5',
    name: 'Muzeum Budownictwa Ludowego',
    initials: 'MB',
    type: 'Instytucja kultury',
    nip: '',
    city: 'Sanok',
    email: 'muzeum@mbl.sanok.pl',
    contactName: 'Ewa Wójcik',
    contactEmail: 'e.wojcik@mbl.sanok.pl',
    contactPhone: '+48 13 463 09 04',
    projects: [BOJKO_FESTIVAL],
    agreement: 'Brak umowy',
    agreementValidUntil: '',
    status: 'PAUSED',
  },
  {
    id: 'partner-6',
    name: 'Stow. Rozwoju Wsi Rozpucie',
    initials: 'SR',
    type: 'Stowarzyszenie',
    nip: '687-19-45-118',
    city: 'Rozpucie',
    email: 'kontakt@rozpucie.org',
    contactName: 'Jan Szczepan',
    contactEmail: 'kontakt@rozpucie.org',
    contactPhone: '+48 692 700 300',
    projects: [HERB_WORKSHOPS],
    agreement: 'Umowa partnerska',
    agreementValidUntil: '2025-12-31',
    status: 'PAUSED',
  },
];
