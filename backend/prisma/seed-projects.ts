import { PrismaClient } from '@prisma/client';
import { PROJECT_SCOPED_MODULES } from '../src/common/enums/module.enum';

const GROUP = {
  status: 1,
  type: 2,
  recipient: 3,
  project: 4,
  stage: 5,
  activity: 6,
  task: 7,
  goal: 8,
  risk: 9,
  member: 10,
  subtask: 11,
  event: 12,
  indicator: 13,
  partner: 14,
  budgetKey: 15,
  budgetVersion: 16,
  budgetCategory: 17,
  budgetPosition: 18,
  budgetColumn: 19,
  budgetActual: 20,
  budgetInvoice: 21,
  budgetHistory: 22,
  memberModule: 23,
} as const;

const takenIds = new Map<string, string>();

function id(group: keyof typeof GROUP, key: string): string {
  const source = `${group}:${key}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const generated = `5eed0000-${String(GROUP[group]).padStart(4, '0')}-4000-8000-0000${hash
    .toString(16)
    .padStart(8, '0')}`;

  const owner = takenIds.get(generated);
  if (owner && owner !== source) {
    throw new Error(
      `Seed id collision between "${owner}" and "${source}" — change one of the keys.`,
    );
  }
  takenIds.set(generated, source);

  return generated;
}

const STATUSES = [
  { name: 'W trakcie realizacji', color: 'green' },
  { name: 'Planowanie', color: 'blue' },
  { name: 'Wstrzymany', color: 'amber' },
  { name: 'Zakończony', color: 'gray' },
];

const TYPES = [
  'Natura i przyroda',
  'Infrastruktura',
  'Kultura i tradycja',
  'Środowisko',
];

const RECIPIENTS = ['Mieszkańcy', 'Studenci', 'Rodziny', 'Turyści'];

const PROJECT_PEOPLE = [
  { key: 'anna', firstName: 'Anna', lastName: 'Wiśniowska' },
  { key: 'piotr', firstName: 'Piotr', lastName: 'Nowak' },
  { key: 'ewa', firstName: 'Ewa', lastName: 'Kowalska' },
  { key: 'marek', firstName: 'Marek', lastName: 'Zieliński' },
  { key: 'tomasz', firstName: 'Tomasz', lastName: 'Bąk' },
  { key: 'jan', firstName: 'Jan', lastName: 'Sokół' },
  { key: 'katarzyna', firstName: 'Katarzyna', lastName: 'Mazur' },
];

function emailFor(person: { firstName: string; lastName: string }): string {
  const strip = (value: string) =>
    value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'L')
      .toLowerCase();

  return `${strip(person.firstName)}.${strip(person.lastName)}@bieszczady.local`;
}

interface SeedTask {
  key: string;
  activity: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  owner: string;
  subtasks?: { title: string; done: boolean }[];
}

interface SeedStage {
  key: string;
  name: string;
  description: string;
  startDate: string;
  deadline: string;
  originalDeadline?: string;
  deadlineNote?: string;
  completedAt?: string;
  archivedAt?: string;
}

interface SeedProject {
  key: string;
  name: string;
  description: string;
  status: string;
  color: string;
  budgetAmount: string;
  startDate: string;
  plannedEndDate: string;
  types: string[];
  recipients: string[];
  members: { person: string; role: string }[];
  goals: { title: string; description: string }[];
  risks: {
    key: string;
    description: string;
    probability: string;
    impact: string;
    owner: string;
  }[];
  stages: SeedStage[];
  activities: { key: string; stage: string; name: string }[];
  tasks: SeedTask[];
  events?: { key: string; actor: string; content: string; at: string }[];
  indicators: {
    key: string;
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    stage: string | null;
    owner: string;
  }[];
}

export const PROJECTS: SeedProject[] = [
  {
    key: 'solina-polanczyk',
    name: 'Szlak rowerowy Solina–Polańczyk',
    description:
      '14 km trasy łączącej trzy miejscowości nad Soliną, z oznakowaniem i miejscami postojowymi.',
    status: 'W trakcie realizacji',
    color: 'green',
    budgetAmount: '1240000.00',
    startDate: '2025-03-01',
    plannedEndDate: '2026-11-30',
    types: ['Natura i przyroda'],
    recipients: ['Studenci'],
    members: [
      { person: 'anna', role: 'COORDINATOR' },
      { person: 'piotr', role: 'EXECUTOR' },
      { person: 'ewa', role: 'EXECUTOR' },
      { person: 'marek', role: 'EXECUTOR' },
    ],
    events: [
      {
        key: 'przesuniecie-oznakowania',
        actor: 'anna',
        content:
          'zatwierdziła przesunięcie terminu etapu „Oznakowanie szlaku” o dwa tygodnie',
        at: '2026-09-16T14:20:00.000Z',
      },
    ],
    goals: [
      {
        title: 'Bezpieczna, oznakowana trasa 22 km',
        description:
          'Cała trasa oznakowana i bezpieczna dla użytkowników od Soliny do Polańczyka.',
      },
      {
        title: 'Przeszkolenie 30 przewodników',
        description:
          'Lokalni przewodnicy przygotowani do prowadzenia grup na nowym szlaku.',
      },
    ],
    risks: [
      {
        key: 'zgoda-dzialka',
        description:
          'Może zabraknąć zgody właściciela działki na oznakowanie odcinka trasy.',
        probability: 'MEDIUM',
        impact: 'HIGH',
        owner: 'anna',
      },
      {
        key: 'dostawca-tablic',
        description:
          'Dostawca tablic informacyjnych może nie dostarczyć ich na czas.',
        probability: 'LOW',
        impact: 'MEDIUM',
        owner: 'piotr',
      },
      {
        key: 'pogoda',
        description: 'Warunki pogodowe mogą wstrzymać prace montażowe.',
        probability: 'MEDIUM',
        impact: 'MEDIUM',
        owner: 'marek',
      },
    ],
    stages: [
      {
        key: 'etap-sp-1',
        name: 'Planowanie trasy',
        description:
          'Analiza przebiegu szlaku, podkłady geodezyjne i wstępne uzgodnienia z gminami.',
        startDate: '2025-03-01',
        deadline: '2025-04-30',
        completedAt: '2025-04-24T14:20:00.000Z',
      },
      {
        key: 'etap-sp-2',
        name: 'Uzgodnienia formalne',
        description:
          'Zgody właścicieli działek i zgłoszenia do instytucji przed rozpoczęciem prac.',
        startDate: '2025-05-01',
        deadline: '2025-07-31',
        completedAt: '2025-08-14T09:05:00.000Z',
      },
      {
        key: 'etap-sp-3',
        name: 'Realizacja oznakowania',
        description:
          'Montaż tablic informacyjnych i drogowskazów na całym odcinku Solina–Polańczyk.',
        startDate: '2025-08-01',
        deadline: '2026-10-31',
        originalDeadline: '2026-07-15',
        deadlineNote:
          'Dostawca tablic przesunął termin produkcji o dwa miesiące.',
      },
      {
        key: 'etap-sp-4',
        name: 'Szkolenia przewodników',
        description:
          'Cykl warsztatów terenowych przygotowujących lokalnych przewodników do pracy na szlaku.',
        startDate: '2026-06-01',
        deadline: '2026-08-20',
      },
      {
        key: 'etap-sp-5',
        name: 'Odbiór końcowy',
        description:
          'Komisyjny odbiór całej trasy. Zakres zadań zostanie doprecyzowany po zakończeniu montażu.',
        startDate: '2026-10-01',
        deadline: '2026-10-20',
      },
      {
        key: 'etap-sp-6',
        name: 'Zamknięcie i rozliczenie',
        description:
          'Rozliczenie dotacji i złożenie wniosku o płatność końcową.',
        startDate: '2026-11-01',
        deadline: '2026-11-30',
      },
      {
        key: 'etap-sp-7',
        name: 'Wariant trasy przez Zawóz',
        description:
          'Rozpoznanie alternatywnego przebiegu szlaku. Wariant wycofany po konsultacjach.',
        startDate: '2025-04-01',
        deadline: '2025-06-30',
        completedAt: '2025-06-28T11:00:00.000Z',
        archivedAt: '2025-07-05T08:30:00.000Z',
      },
    ],
    activities: [
      { key: 'dz-sp-1', stage: 'etap-sp-1', name: 'Analiza przebiegu szlaku' },
      {
        key: 'dz-sp-2',
        stage: 'etap-sp-2',
        name: 'Pozwolenia i zgody właścicieli',
      },
      {
        key: 'dz-sp-3',
        stage: 'etap-sp-3',
        name: 'Montaż tablic i drogowskazów',
      },
      { key: 'dz-sp-4', stage: 'etap-sp-3', name: 'Odbiory odcinkowe' },
      { key: 'dz-sp-5', stage: 'etap-sp-4', name: 'Warsztaty terenowe' },
      { key: 'dz-sp-6', stage: 'etap-sp-6', name: 'Rozliczenie dotacji' },
      { key: 'dz-sp-7', stage: 'etap-sp-7', name: 'Rozpoznanie wariantu' },
    ],
    tasks: [
      {
        key: 'zad-sp-1',
        activity: 'dz-sp-1',
        title: 'Zebrać mapy i podkłady geodezyjne',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: '2025-03-20',
        owner: 'anna',
      },
      {
        key: 'zad-sp-2',
        activity: 'dz-sp-1',
        title: 'Uzgodnić wstępny przebieg z gminami',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2025-04-18',
        owner: 'piotr',
      },
      {
        key: 'zad-sp-3',
        activity: 'dz-sp-2',
        title: 'Uzyskać zgody właścicieli działek',
        status: 'DONE',
        priority: 'LOW',
        dueDate: '2025-07-10',
        owner: 'anna',
      },
      {
        key: 'zad-sp-4',
        activity: 'dz-sp-2',
        title: 'Zgłosić trasę do RDOŚ',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: '2025-07-25',
        owner: 'marek',
      },
      {
        key: 'zad-sp-5',
        activity: 'dz-sp-3',
        title: 'Zamówić tablice informacyjne',
        status: 'DONE',
        priority: 'LOW',
        dueDate: '2026-03-10',
        owner: 'marek',
      },
      {
        key: 'zad-sp-6',
        activity: 'dz-sp-3',
        title: 'Zamontować drogowskazy Solina–Bereźnica',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2026-06-30',
        owner: 'marek',
      },
      {
        key: 'zad-sp-7',
        activity: 'dz-sp-3',
        title: 'Zamontować drogowskazy Bereźnica–Polańczyk',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: '2026-10-15',
        owner: 'marek',
        subtasks: [
          { title: 'Wytyczyć miejsca montażu', done: true },
          { title: 'Przygotować fundamenty', done: true },
          { title: 'Zamontować słupki', done: false },
          { title: 'Przykręcić tablice kierunkowe', done: false },
        ],
      },
      {
        key: 'zad-sp-8',
        activity: 'dz-sp-4',
        title: 'Protokół odbioru odcinka 1',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: '2026-07-20',
        owner: 'anna',
      },
      {
        key: 'zad-sp-9',
        activity: 'dz-sp-4',
        title: 'Protokół odbioru odcinka 2',
        status: 'BLOCKED',
        priority: 'LOW',
        dueDate: '2026-10-25',
        owner: 'anna',
      },
      {
        key: 'zad-sp-10',
        activity: 'dz-sp-5',
        title: 'Przeprowadzić warsztat nr 16',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: '2026-08-05',
        owner: 'ewa',
      },
      {
        key: 'zad-sp-11',
        activity: 'dz-sp-5',
        title: 'Wydrukować listy obecności',
        status: 'IN_PROGRESS',
        priority: 'LOW',
        dueDate: '2026-08-08',
        owner: 'ewa',
      },
      {
        key: 'zad-sp-12',
        activity: 'dz-sp-5',
        title: 'Zebrać ankiety ewaluacyjne',
        status: 'BLOCKED',
        priority: 'HIGH',
        dueDate: '2026-08-18',
        owner: 'ewa',
        subtasks: [
          { title: 'Wydrukować ankiety', done: true },
          { title: 'Rozdać na warsztacie', done: true },
        ],
      },
      {
        key: 'zad-sp-13',
        activity: 'dz-sp-6',
        title: 'Skompletować faktury',
        status: 'NEW',
        priority: 'MEDIUM',
        dueDate: '2026-11-10',
        owner: 'anna',
      },
      {
        key: 'zad-sp-14',
        activity: 'dz-sp-6',
        title: 'Złożyć wniosek o płatność końcową',
        status: 'NEW',
        priority: 'HIGH',
        dueDate: '2026-11-25',
        owner: 'anna',
      },
      {
        key: 'zad-sp-15',
        activity: 'dz-sp-7',
        title: 'Wizja lokalna w Zawozie',
        status: 'DONE',
        priority: 'LOW',
        dueDate: '2025-05-15',
        owner: 'piotr',
      },
    ],
    indicators: [
      {
        key: 'warsztaty',
        name: 'Liczba przeprowadzonych warsztatów',
        description: 'Warsztaty terenowe dla lokalnych przewodników.',
        targetValue: 5,
        currentValue: 3,
        stage: 'etap-sp-4',
        owner: 'anna',
      },
      {
        key: 'tablice',
        name: 'Liczba zamontowanych tablic informacyjnych',
        description: '',
        targetValue: 24,
        currentValue: 0,
        stage: null,
        owner: 'piotr',
      },
    ],
  },
];

const PARTNERS = [
  {
    key: 'fundacja-bieszczadzka',
    name: 'Fundacja Bieszczadzka',
    type: 'Fundacja',
    nip: '6891122333',
    city: 'Ustrzyki Dolne',
    email: 'biuro@fundacja.pl',
    contactName: 'Maria Zielińska',
    contactEmail: 'm.zielinska@fundacja.pl',
    contactPhone: '+48 601 234 567',
    agreement: 'Umowa partnerska',
    agreementValidUntil: '2026-12-31',
    status: 'ACTIVE',
    projects: ['solina-polanczyk'],
  },
  {
    key: 'gmina-lutowiska',
    name: 'Gmina Lutowiska',
    type: 'Samorząd',
    nip: '6881004521',
    city: 'Lutowiska',
    email: 'sekretariat@lutowiska.pl',
    contactName: 'Tomasz Hnat',
    contactEmail: 't.hnat@lutowiska.pl',
    contactPhone: '+48 13 461 00 01',
    agreement: 'Porozumienie',
    agreementValidUntil: null,
    status: 'ACTIVE',
    projects: ['solina-polanczyk'],
  },
  {
    key: 'nadlesnictwo-ustrzyki',
    name: 'Nadleśnictwo Ustrzyki Dolne',
    type: 'Instytucja publiczna',
    nip: '',
    city: 'Ustrzyki Dolne',
    email: 'ustrzyki@krosno.lasy.gov.pl',
    contactName: 'Piotr Sawicki',
    contactEmail: 'p.sawicki@krosno.lasy.gov.pl',
    contactPhone: '+48 13 461 13 10',
    agreement: 'List intencyjny',
    agreementValidUntil: '2026-11-30',
    status: 'ACTIVE',
    projects: ['solina-polanczyk'],
  },
  {
    key: 'lgd-zielone-bieszczady',
    name: 'LGD Zielone Bieszczady',
    type: 'Stowarzyszenie',
    nip: '6891233771',
    city: 'Lesko',
    email: 'biuro@zielonebieszczady.pl',
    contactName: 'Anna Kowalska',
    contactEmail: 'biuro@zielonebieszczady.pl',
    contactPhone: '+48 604 555 120',
    agreement: 'Umowa partnerska',
    agreementValidUntil: '2027-06-30',
    status: 'ACTIVE',
    projects: ['solina-polanczyk'],
  },
  {
    key: 'muzeum-budownictwa-ludowego',
    name: 'Muzeum Budownictwa Ludowego',
    type: 'Instytucja kultury',
    nip: '',
    city: 'Sanok',
    email: 'muzeum@mbl.sanok.pl',
    contactName: 'Ewa Wójcik',
    contactEmail: 'e.wojcik@mbl.sanok.pl',
    contactPhone: '+48 13 463 09 04',
    agreement: 'Brak umowy',
    agreementValidUntil: null,
    status: 'PAUSED',
    projects: [],
  },
];

type SeedPlanRow = [
  category: string,
  key: string,
  name: string,
  planned: number,
  grant: number,
  ownContribution: number,
];

const BUDGET_CATEGORIES: {
  key: string;
  name: string;
  partner: string | null;
}[] = [
  { key: 'programme', name: 'Działania programowe', partner: null },
  { key: 'signage', name: 'Oznakowanie szlaku', partner: 'gmina-lutowiska' },
  { key: 'promotion', name: 'Promocja i wydarzenia', partner: null },
  { key: 'admin', name: 'Koszty administracyjne', partner: null },
];

const BASE_PLAN: SeedPlanRow[] = [
  ['programme', 'shelter', 'Zbudowanie wiaty', 100000, 85000, 15000],
  ['programme', 'site', 'Przygotowanie terenu', 50000, 42500, 7500],
  ['programme', 'equipment', 'Wyposażenie wiaty', 50000, 0, 50000],
  ['signage', 'boards', 'Tablice informacyjne', 18000, 15300, 2700],
  ['signage', 'signs', 'Znaki kierunkowe', 9500, 8075, 1425],
  ['promotion', 'festival', 'Festyn otwarcia szlaku', 20000, 17000, 3000],
  ['promotion', 'materials', 'Materiały promocyjne', 15000, 12750, 2250],
  ['admin', 'coordination', 'Koordynacja projektu', 30000, 0, 30000],
];

const ANNEX_1_PLAN: SeedPlanRow[] = BASE_PLAN.map((row) => {
  if (row[1] === 'festival')
    return [...row.slice(0, 3), 13800, 11730, 2070] as SeedPlanRow;
  if (row[1] === 'coordination')
    return [...row.slice(0, 3), 36200, 0, 36200] as SeedPlanRow;
  return row;
});

const ANNEX_2_PLAN: SeedPlanRow[] = [
  ...ANNEX_1_PLAN.filter((row) => row[1] !== 'signs').map((row) =>
    row[1] === 'boards'
      ? ([...row.slice(0, 3), 18500, 15725, 2775] as SeedPlanRow)
      : row,
  ),
  ['admin', 'evaluation', 'Ewaluacja projektu', 8000, 6800, 1200],
];

const BUDGET_VERSIONS = [
  {
    key: 'base',
    number: 0,
    name: 'Wersja podstawowa',
    status: 'APPROVED',
    isCurrent: false,
    createdAt: '2026-01-15T09:00:00.000Z',
    submittedAt: null,
    approvedAt: '2026-01-20T10:00:00.000Z',
    savedAt: null,
    description: 'Budżet z umowy o dofinansowanie',
    plan: BASE_PLAN,
  },
  {
    key: 'annex-1',
    number: 1,
    name: 'Aneks 1',
    status: 'APPROVED',
    isCurrent: true,
    createdAt: '2026-05-04T08:30:00.000Z',
    submittedAt: '2026-05-05T12:10:00.000Z',
    approvedAt: '2026-05-12T09:45:00.000Z',
    savedAt: null,
    description: 'Przesunięcie środków z promocji na koordynację',
    plan: ANNEX_1_PLAN,
  },
  {
    key: 'annex-2',
    number: 2,
    name: 'Aneks 2',
    status: 'PENDING',
    isCurrent: false,
    createdAt: '2026-10-01T07:50:00.000Z',
    submittedAt: '2026-10-02T14:20:00.000Z',
    approvedAt: null,
    savedAt: '2026-10-02T14:05:00.000Z',
    description: '',
    plan: ANNEX_2_PLAN,
  },
];

const BUDGET_ACTUALS: {
  position: string;
  person: string;
  source: string;
  incurred: number;
  invoices: [
    key: string,
    number: string,
    amount: number,
    contractor: string,
    date: string,
    grant: number,
    ownContribution: number,
    status: string,
  ][];
}[] = [
  {
    position: 'shelter',
    person: 'Anna Wiśniowska',
    source: 'Dotacja PROW',
    incurred: 72500,
    invoices: [
      [
        'shelter-1',
        'FV/2026/02/114',
        40000,
        'Budmax Sp. z o.o.',
        '2026-02-14',
        34000,
        6000,
        'PAID',
      ],
      [
        'shelter-2',
        'FV/2026/03/052',
        22500,
        'Budmax Sp. z o.o.',
        '2026-03-21',
        19125,
        3375,
        'PAID',
      ],
      [
        'shelter-3',
        'FV/2026/04/017',
        10000,
        'Tartak Leśny s.c.',
        '2026-04-08',
        8500,
        1500,
        'TO_BE_PAID',
      ],
    ],
  },
  {
    position: 'site',
    person: 'Marek Zieliński',
    source: 'Dotacja PROW',
    incurred: 50000,
    invoices: [],
  },
  {
    position: 'equipment',
    person: 'Ewa Kowalska',
    source: 'Wkład własny gminy',
    incurred: 0,
    invoices: [],
  },
  {
    position: 'boards',
    person: 'Piotr Nowak',
    source: 'Dotacja PROW',
    incurred: 18450,
    invoices: [],
  },
  {
    position: 'signs',
    person: 'Piotr Nowak',
    source: 'Dotacja PROW',
    incurred: 4200,
    invoices: [],
  },
  {
    position: 'festival',
    person: 'Katarzyna Mazur',
    source: 'Dotacja PROW',
    incurred: 12000,
    invoices: [],
  },
  {
    position: 'materials',
    person: 'Katarzyna Mazur',
    source: 'Dotacja PROW',
    incurred: 15000,
    invoices: [],
  },
  {
    position: 'coordination',
    person: 'Anna Wiśniowska',
    source: 'Wkład własny',
    incurred: 36200,
    invoices: [],
  },
];

const BUDGET_HISTORY: {
  key: string;
  at: string;
  byDirector: boolean;
  version: string;
  kind: string;
  comment: string | null;
}[] = [
  {
    key: 'h-1',
    at: '2026-01-20T10:00:00.000Z',
    byDirector: true,
    version: 'base',
    kind: 'APPROVED',
    comment: 'Budżet z umowy o dofinansowanie',
  },
  {
    key: 'h-2',
    at: '2026-05-04T08:30:00.000Z',
    byDirector: false,
    version: 'annex-1',
    kind: 'CREATED',
    comment: null,
  },
  {
    key: 'h-3',
    at: '2026-05-05T12:10:00.000Z',
    byDirector: false,
    version: 'annex-1',
    kind: 'SUBMITTED',
    comment: null,
  },
  {
    key: 'h-4',
    at: '2026-05-12T09:45:00.000Z',
    byDirector: true,
    version: 'annex-1',
    kind: 'APPROVED',
    comment: 'Przesunięcie środków z promocji na koordynację',
  },
  {
    key: 'h-5',
    at: '2026-10-01T07:50:00.000Z',
    byDirector: false,
    version: 'annex-2',
    kind: 'CREATED',
    comment: null,
  },
  {
    key: 'h-6',
    at: '2026-10-02T14:05:00.000Z',
    byDirector: false,
    version: 'annex-2',
    kind: 'EDITED',
    comment: null,
  },
  {
    key: 'h-7',
    at: '2026-10-02T14:20:00.000Z',
    byDirector: false,
    version: 'annex-2',
    kind: 'SUBMITTED',
    comment: null,
  },
];

const BUDGET_COLUMNS = [
  { key: 'planned', name: 'Plan', type: 'money', locked: true },
  { key: 'incurred', name: 'Poniesione', type: 'money', locked: true },
  { key: 'person', name: 'Osoba odpowiedzialna', type: 'text', locked: false },
  { key: 'source', name: 'Źródło finansowania', type: 'text', locked: false },
  { key: 'grant', name: 'Dotacja', type: 'money', locked: true },
  { key: 'ownContribution', name: 'Wkład własny', type: 'money', locked: true },
];

const BUDGET_PROJECT = 'solina-polanczyk';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export async function upsertUserWithModules(
  prisma: PrismaClient,
  user: {
    email: string;
    firstName: string;
    lastName: string;
    passwordHash: string;
    modules: string[];
    grantedById: string;
    accountStatus?: string;
    deletedAt?: Date;
  },
): Promise<{ id: string }> {
  const created = await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      passwordHash: user.passwordHash,
      isDirector: false,
      accountStatus: user.accountStatus ?? 'ACTIVE',
      deletedAt: user.deletedAt ?? null,
      mustChangePassword: false,
    },
  });

  for (const module of user.modules) {
    await prisma.userModuleAccess.upsert({
      where: { userId_module: { userId: created.id, module } },
      update: {},
      create: { userId: created.id, module, grantedById: user.grantedById },
    });
  }

  return created;
}

export async function seedProjects(
  prisma: PrismaClient,
  passwordHash: string,
  grantedById: string,
  defaultModules: string[],
  projects: SeedProject[],
): Promise<void> {
  for (const status of STATUSES) {
    await prisma.projectStatus.upsert({
      where: { id: id('status', status.name) },
      update: { name: status.name, color: status.color },
      create: { id: id('status', status.name), ...status },
    });
  }

  for (const name of TYPES) {
    await prisma.projectType.upsert({
      where: { id: id('type', name) },
      update: { name },
      create: { id: id('type', name), name },
    });
  }

  for (const name of RECIPIENTS) {
    await prisma.projectRecipient.upsert({
      where: { id: id('recipient', name) },
      update: { name },
      create: { id: id('recipient', name), name },
    });
  }

  const userIdByKey = new Map<string, string>();

  for (const person of PROJECT_PEOPLE) {
    const user = await upsertUserWithModules(prisma, {
      email: emailFor(person),
      firstName: person.firstName,
      lastName: person.lastName,
      passwordHash,
      modules: defaultModules,
      grantedById,
    });
    userIdByKey.set(person.key, user.id);
  }

  for (const project of projects) {
    const projectId = id('project', project.key);
    const data = {
      name: project.name,
      description: project.description,
      statusId: id('status', project.status),
      color: project.color,
      budgetAmount: project.budgetAmount,
      startDate: day(project.startDate),
      plannedEndDate: day(project.plannedEndDate),
    };

    await prisma.project.upsert({
      where: { id: projectId },
      update: data,
      create: { id: projectId, ...data },
    });

    for (const name of project.types) {
      await prisma.projectTypesOnProjects.upsert({
        where: {
          projectId_projectTypeId: {
            projectId,
            projectTypeId: id('type', name),
          },
        },
        update: {},
        create: { projectId, projectTypeId: id('type', name) },
      });
    }

    for (const name of project.recipients) {
      await prisma.projectRecipientsOnProjects.upsert({
        where: {
          projectId_recipientId: {
            projectId,
            recipientId: id('recipient', name),
          },
        },
        update: {},
        create: { projectId, recipientId: id('recipient', name) },
      });
    }

    for (const member of project.members) {
      const userId = userIdByKey.get(member.person)!;
      const memberRow = await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        update: { projectRole: member.role },
        create: {
          id: id('member', `${project.key}:${member.person}`),
          projectId,
          userId,
          projectRole: member.role,
        },
      });
      for (const module of PROJECT_SCOPED_MODULES) {
        await prisma.projectMemberModule.upsert({
          where: { memberId_module: { memberId: memberRow.id, module } },
          update: {},
          create: {
            id: id('memberModule', `${project.key}:${member.person}:${module}`),
            memberId: memberRow.id,
            module,
          },
        });
      }
    }

    for (const event of project.events ?? []) {
      const eventId = id('event', `${project.key}:${event.key}`);
      const eventData = {
        actorId: userIdByKey.get(event.actor)!,
        source: 'MANUAL',
        content: event.content,
        createdAt: new Date(event.at),
      };
      await prisma.projectEvent.upsert({
        where: { id: eventId },
        update: eventData,
        create: {
          id: eventId,
          projectId,
          dedupeKey: `seed:${project.key}:${event.key}`,
          ...eventData,
        },
      });
    }

    for (const [index, goal] of project.goals.entries()) {
      const goalId = id('goal', `${project.key}:${index}`);
      await prisma.goal.upsert({
        where: { id: goalId },
        update: { goalNumber: index + 1, ...goal },
        create: { id: goalId, projectId, goalNumber: index + 1, ...goal },
      });
    }

    for (const risk of project.risks) {
      const riskId = id('risk', `${project.key}:${risk.key}`);
      const riskData = {
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact,
        responsibleUserId: userIdByKey.get(risk.owner)!,
      };
      await prisma.risk.upsert({
        where: { id: riskId },
        update: riskData,
        create: { id: riskId, projectId, ...riskData },
      });
    }

    for (const [index, stage] of project.stages.entries()) {
      const stageId = id('stage', stage.key);
      const stageData = {
        name: stage.name,
        description: stage.description,
        sortOrder: index + 1,
        startDate: day(stage.startDate),
        deadline: day(stage.deadline),
        originalDeadline: stage.originalDeadline
          ? day(stage.originalDeadline)
          : null,
        deadlineNote: stage.deadlineNote ?? null,
        completedAt: stage.completedAt ? new Date(stage.completedAt) : null,
        archivedAt: stage.archivedAt ? new Date(stage.archivedAt) : null,
      };
      await prisma.stage.upsert({
        where: { id: stageId },
        update: stageData,
        create: { id: stageId, projectId, ...stageData },
      });
    }

    for (const [index, activity] of project.activities.entries()) {
      const activityId = id('activity', activity.key);
      const activityData = {
        name: activity.name,
        sortOrder: index + 1,
        stageId: id('stage', activity.stage),
      };
      await prisma.activity.upsert({
        where: { id: activityId },
        update: activityData,
        create: { id: activityId, ...activityData },
      });
    }

    for (const task of project.tasks) {
      const taskId = id('task', task.key);
      const taskData = {
        activityId: id('activity', task.activity),
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: day(task.dueDate),
        ownerId: userIdByKey.get(task.owner)!,
      };
      await prisma.task.upsert({
        where: { id: taskId },
        update: taskData,
        create: { id: taskId, ...taskData },
      });

      for (const [index, subtask] of (task.subtasks ?? []).entries()) {
        const subtaskId = id('subtask', `${task.key}-${index + 1}`);
        const subtaskData = {
          taskId,
          title: subtask.title,
          done: subtask.done,
          sortOrder: index + 1,
        };
        await prisma.subtask.upsert({
          where: { id: subtaskId },
          update: subtaskData,
          create: { id: subtaskId, ...subtaskData },
        });
      }
    }

    for (const indicator of project.indicators) {
      const indicatorId = id('indicator', `${project.key}:${indicator.key}`);
      const indicatorData = {
        name: indicator.name,
        description: indicator.description,
        targetValue: indicator.targetValue,
        currentValue: indicator.currentValue,
        scope: indicator.stage ? 'STAGE' : 'PROJECT',
        stageId: indicator.stage ? id('stage', indicator.stage) : null,
        taskId: null,
        ownerId: userIdByKey.get(indicator.owner)!,
      };
      await prisma.indicator.upsert({
        where: { id: indicatorId },
        update: indicatorData,
        create: { id: indicatorId, projectId, ...indicatorData },
      });
    }
  }

  for (const partner of PARTNERS) {
    const partnerId = id('partner', partner.key);
    const partnerData = {
      name: partner.name,
      type: partner.type,
      nip: partner.nip,
      city: partner.city,
      email: partner.email,
      contactName: partner.contactName,
      contactEmail: partner.contactEmail,
      contactPhone: partner.contactPhone,
      agreement: partner.agreement,
      status: partner.status,
      agreementValidUntil: partner.agreementValidUntil
        ? day(partner.agreementValidUntil)
        : null,
    };
    await prisma.partner.upsert({
      where: { id: partnerId },
      update: partnerData,
      create: { id: partnerId, ...partnerData },
    });

    for (const projectKey of partner.projects) {
      const projectId = id('project', projectKey);
      await prisma.partnerProject.upsert({
        where: { partnerId_projectId: { partnerId, projectId } },
        update: {},
        create: { partnerId, projectId },
      });
    }
  }

  if (projects.some((project) => project.key === BUDGET_PROJECT)) {
    await seedBudget(prisma, grantedById, userIdByKey.get('anna')!);
  }
}

async function seedBudget(
  prisma: PrismaClient,
  directorId: string,
  authorId: string,
): Promise<void> {
  const projectId = id('project', BUDGET_PROJECT);
  const key = (name: string) => id('budgetKey', name);

  for (const [index, column] of BUDGET_COLUMNS.entries()) {
    const columnId = id('budgetColumn', column.key);
    const columnData = { ...column, sortOrder: index + 1 };
    await prisma.budgetColumn.upsert({
      where: { id: columnId },
      update: columnData,
      create: { id: columnId, projectId, ...columnData },
    });
  }

  for (const version of BUDGET_VERSIONS) {
    const versionId = id('budgetVersion', version.key);
    const versionData = {
      number: version.number,
      name: version.name,
      status: version.status,
      isCurrent: version.isCurrent,
      description: version.description,
      createdById: authorId,
      createdAt: new Date(version.createdAt),
      submittedById: version.submittedAt ? authorId : null,
      submittedAt: version.submittedAt ? new Date(version.submittedAt) : null,
      approvedById: version.approvedAt ? directorId : null,
      approvedAt: version.approvedAt ? new Date(version.approvedAt) : null,
      savedAt: version.savedAt ? new Date(version.savedAt) : null,
    };
    await prisma.budgetVersion.upsert({
      where: { id: versionId },
      update: versionData,
      create: { id: versionId, projectId, ...versionData },
    });

    const usedCategories = new Set(version.plan.map((row) => row[0]));
    for (const [index, category] of BUDGET_CATEGORIES.entries()) {
      if (!usedCategories.has(category.key)) continue;
      const categoryId = id('budgetCategory', `${version.key}:${category.key}`);
      const categoryData = {
        name: category.name,
        partnerId: category.partner ? id('partner', category.partner) : null,
        sortOrder: index + 1,
      };
      await prisma.budgetCategory.upsert({
        where: { id: categoryId },
        update: categoryData,
        create: {
          id: categoryId,
          versionId,
          key: key(category.key),
          ...categoryData,
        },
      });
    }

    const keptPositions = version.plan.map((row) =>
      id('budgetPosition', `${version.key}:${row[1]}`),
    );
    await prisma.budgetPosition.deleteMany({
      where: { versionId, id: { notIn: keptPositions } },
    });
    for (const [index, row] of version.plan.entries()) {
      const [category, position, name, planned, grant, ownContribution] = row;
      const positionId = id('budgetPosition', `${version.key}:${position}`);
      const positionData = {
        categoryKey: key(category),
        name,
        sortOrder: index + 1,
        planned,
        grant,
        ownContribution,
      };
      await prisma.budgetPosition.upsert({
        where: { id: positionId },
        update: positionData,
        create: {
          id: positionId,
          versionId,
          key: key(position),
          ...positionData,
        },
      });
    }
  }

  const signage = key('signage');
  await prisma.budgetCategorySettings.upsert({
    where: { projectId_categoryKey: { projectId, categoryKey: signage } },
    update: { detailed: false, partnerCanEdit: false, visibleToPartner: true },
    create: {
      projectId,
      categoryKey: signage,
      detailed: false,
      partnerCanEdit: false,
      visibleToPartner: true,
    },
  });

  for (const actual of BUDGET_ACTUALS) {
    const positionKey = key(actual.position);
    const stored = await prisma.budgetActual.upsert({
      where: { projectId_positionKey: { projectId, positionKey } },
      update: {},
      create: {
        id: id('budgetActual', actual.position),
        projectId,
        positionKey,
      },
    });

    const values = {
      person: actual.person,
      source: actual.source,
      incurred: actual.incurred.toFixed(2),
    };
    for (const [columnKey, value] of Object.entries(values)) {
      await prisma.budgetActualValue.upsert({
        where: { actualId_columnKey: { actualId: stored.id, columnKey } },
        update: { value },
        create: { actualId: stored.id, columnKey, value },
      });
    }

    for (const invoice of actual.invoices) {
      const [
        invoiceKey,
        number,
        amount,
        contractor,
        date,
        grant,
        ownContribution,
        status,
      ] = invoice;
      const invoiceId = id('budgetInvoice', invoiceKey);
      const invoiceData = {
        actualId: stored.id,
        number,
        amount,
        contractor,
        date: day(date),
        grant,
        ownContribution,
        status,
        enteredById: authorId,
      };
      await prisma.budgetInvoice.upsert({
        where: { id: invoiceId },
        update: invoiceData,
        create: { id: invoiceId, ...invoiceData },
      });
    }
  }

  for (const entry of BUDGET_HISTORY) {
    const entryId = id('budgetHistory', entry.key);
    const version = BUDGET_VERSIONS.find((v) => v.key === entry.version)!;
    const entryData = {
      versionId: id('budgetVersion', entry.version),
      versionName: version.name,
      kind: entry.kind,
      comment: entry.comment,
      actorId: entry.byDirector ? directorId : authorId,
      at: new Date(entry.at),
    };
    await prisma.budgetHistoryEntry.upsert({
      where: { id: entryId },
      update: entryData,
      create: { id: entryId, projectId, ...entryData },
    });
  }
}
