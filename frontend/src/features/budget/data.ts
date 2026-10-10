import type { RadioPillOption } from '../../components/ui/RadioPillGroup';
import type {
  Actor,
  BudgetStore,
  BudgetVersion,
  HistoryKind,
  Invoice,
  InvoiceStatus,
  PlanCategory,
  PlanPosition,
  PositionActuals,
  VersionStatus,
} from './types';

export const COLUMN_TYPE_OPTIONS: RadioPillOption[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'money', label: 'Kwota' },
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  TO_BE_PAID: 'Do wypłaty',
  PAID: 'Zapłacono',
};

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  TO_BE_PAID: 'bg-amberSoft text-amberDark',
  PAID: 'bg-lightGreen text-darkGreen',
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  DRAFT: 'Roboczy',
  PENDING: 'Do rozpatrzenia',
  APPROVED: 'Zatwierdzony',
};

export const VERSION_STATUS_CLASSES: Record<VersionStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-600',
  PENDING: 'bg-amberSoft text-amberDark',
  APPROVED: 'bg-lightGreen text-darkGreen',
};

export const HISTORY_KIND_LABELS: Record<HistoryKind, string> = {
  CREATED: 'utworzono',
  EDITED: 'edytowano plan',
  SUBMITTED: 'wysłano do akceptacji',
  WITHDRAWN: 'wycofano prośbę o akceptację',
  APPROVED: 'zatwierdzono',
  REJECTED: 'odrzucono',
  REVERTED: 'cofnięto zatwierdzenie',
  DISCARDED: 'odrzucono wersję roboczą',
  METADATA_EDITED: 'zmieniono opis',
};

const ANNA: Actor = { id: 'mock-anna', name: 'Anna Kowalczyk' };
const DIRECTOR: Actor = { id: 'mock-director', name: 'Joanna Nowicka' };

function plan(
  id: string,
  name: string,
  planned: number,
  grant: number,
  ownContribution: number,
): PlanPosition {
  return { id, name, planned, grant, ownContribution };
}

function actuals(
  person: string,
  source: string,
  incurred: number,
  invoices: Invoice[] = [],
): PositionActuals {
  return {
    values: { person, source, incurred },
    invoices,
    status: null,
    document: null,
  };
}

function invoice(
  id: string,
  number: string,
  amount: number,
  contractor: string,
  date: string,
  grant: number,
  ownContribution: number,
  status: InvoiceStatus,
): Invoice {
  return {
    id,
    number,
    amount,
    contractor,
    date,
    grant,
    ownContribution,
    enteredBy: 'Fundacja',
    status,
    document: null,
  };
}

const BASE_PLAN: PlanCategory[] = [
  {
    id: 'programme',
    name: 'Działania programowe',
    partnerId: null,
    positions: [
      plan('shelter', 'Zbudowanie wiaty', 100000, 85000, 15000),
      plan('site', 'Przygotowanie terenu', 50000, 42500, 7500),
      plan('equipment', 'Wyposażenie wiaty', 50000, 0, 50000),
    ],
  },
  {
    id: 'signage',
    name: 'Oznakowanie szlaku',
    partnerId: 'partner-2',
    positions: [
      plan('boards', 'Tablice informacyjne', 18000, 15300, 2700),
      plan('signs', 'Znaki kierunkowe', 9500, 8075, 1425),
    ],
  },
  {
    id: 'promotion',
    name: 'Promocja i wydarzenia',
    partnerId: null,
    positions: [
      plan('festival', 'Festyn otwarcia szlaku', 20000, 17000, 3000),
      plan('materials', 'Materiały promocyjne', 15000, 12750, 2250),
    ],
  },
  {
    id: 'admin',
    name: 'Koszty administracyjne',
    partnerId: null,
    positions: [plan('coordination', 'Koordynacja projektu', 30000, 0, 30000)],
  },
];

const ANNEX_1_PLAN: PlanCategory[] = BASE_PLAN.map((category) => ({
  ...category,
  positions: category.positions.map((position) =>
    position.id === 'festival'
      ? { ...position, planned: 13800, grant: 11730, ownContribution: 2070 }
      : position.id === 'coordination'
        ? { ...position, planned: 36200, ownContribution: 36200 }
        : position,
  ),
}));

const ANNEX_2_PLAN: PlanCategory[] = ANNEX_1_PLAN.map((category) =>
  category.id === 'signage'
    ? {
        ...category,
        positions: category.positions
          .filter((position) => position.id !== 'signs')
          .map((position) =>
            position.id === 'boards'
              ? {
                  ...position,
                  planned: 18500,
                  grant: 15725,
                  ownContribution: 2775,
                }
              : position,
          ),
      }
    : category.id === 'admin'
      ? {
          ...category,
          positions: [
            ...category.positions,
            plan('evaluation', 'Ewaluacja projektu', 8000, 6800, 1200),
          ],
        }
      : category,
);

function version(
  fields: Pick<
    BudgetVersion,
    'id' | 'number' | 'name' | 'status' | 'categories'
  > &
    Partial<BudgetVersion>,
): BudgetVersion {
  return {
    isCurrent: false,
    createdBy: ANNA,
    createdAt: '2026-01-15T09:00:00.000Z',
    submittedBy: null,
    submittedAt: null,
    approvedBy: null,
    approvedAt: null,
    description: '',
    rejections: [],
    savedAt: null,
    ...fields,
  };
}

export const INITIAL_STORE: BudgetStore = {
  columns: [
    { id: 'planned', name: 'Plan', type: 'money', locked: true },
    { id: 'incurred', name: 'Poniesione', type: 'money', locked: true },
    {
      id: 'person',
      name: 'Osoba odpowiedzialna',
      type: 'text',
      locked: false,
    },
    { id: 'source', name: 'Źródło finansowania', type: 'text', locked: false },
    { id: 'grant', name: 'Dotacja', type: 'money', locked: true },
    {
      id: 'ownContribution',
      name: 'Wkład własny',
      type: 'money',
      locked: true,
    },
  ],
  versions: [
    version({
      id: 'base',
      number: 0,
      name: 'Wersja podstawowa',
      status: 'APPROVED',
      approvedBy: DIRECTOR,
      approvedAt: '2026-01-20T10:00:00.000Z',
      description: 'Budżet z umowy o dofinansowanie',
      categories: BASE_PLAN,
    }),
    version({
      id: 'annex-1',
      number: 1,
      name: 'Aneks 1',
      status: 'APPROVED',
      isCurrent: true,
      createdAt: '2026-05-04T08:30:00.000Z',
      submittedBy: ANNA,
      submittedAt: '2026-05-05T12:10:00.000Z',
      approvedBy: DIRECTOR,
      approvedAt: '2026-05-12T09:45:00.000Z',
      description: 'Przesunięcie środków z promocji na koordynację',
      categories: ANNEX_1_PLAN,
    }),
    version({
      id: 'annex-2',
      number: 2,
      name: 'Aneks 2',
      status: 'PENDING',
      createdAt: '2026-10-01T07:50:00.000Z',
      submittedBy: ANNA,
      submittedAt: '2026-10-02T14:20:00.000Z',
      savedAt: '2026-10-02T14:05:00.000Z',
      categories: ANNEX_2_PLAN,
    }),
  ],
  actuals: {
    shelter: actuals('Anna Kowalczyk', 'Dotacja PROW', 72500, [
      invoice(
        'shelter-1',
        'FV/2026/02/114',
        40000,
        'Budmax Sp. z o.o.',
        '2026-02-14',
        34000,
        6000,
        'PAID',
      ),
      invoice(
        'shelter-2',
        'FV/2026/03/052',
        22500,
        'Budmax Sp. z o.o.',
        '2026-03-21',
        19125,
        3375,
        'PAID',
      ),
      invoice(
        'shelter-3',
        'FV/2026/04/017',
        10000,
        'Tartak Leśny s.c.',
        '2026-04-08',
        8500,
        1500,
        'TO_BE_PAID',
      ),
    ]),
    site: actuals('Marek Nowak', 'Dotacja PROW', 50000),
    equipment: actuals('Ewa Mazur', 'Wkład własny gminy', 0),
    boards: actuals('Piotr Wójcik', 'Dotacja PROW', 18450),
    signs: actuals('Piotr Wójcik', 'Dotacja PROW', 4200),
    festival: actuals('Katarzyna Lis', 'Dotacja PROW', 12000),
    materials: actuals('Katarzyna Lis', 'Dotacja PROW', 15000),
    coordination: actuals('Anna Kowalczyk', 'Wkład własny', 36200),
  },
  categorySettings: {
    signage: { detailed: false, partnerCanEdit: false, visibleToPartner: true },
  },
  history: [
    {
      id: 'h-1',
      at: '2026-01-20T10:00:00.000Z',
      by: DIRECTOR,
      versionId: 'base',
      versionName: 'Wersja podstawowa',
      kind: 'APPROVED',
      comment: 'Budżet z umowy o dofinansowanie',
    },
    {
      id: 'h-2',
      at: '2026-05-04T08:30:00.000Z',
      by: ANNA,
      versionId: 'annex-1',
      versionName: 'Aneks 1',
      kind: 'CREATED',
      comment: null,
    },
    {
      id: 'h-3',
      at: '2026-05-05T12:10:00.000Z',
      by: ANNA,
      versionId: 'annex-1',
      versionName: 'Aneks 1',
      kind: 'SUBMITTED',
      comment: null,
    },
    {
      id: 'h-4',
      at: '2026-05-12T09:45:00.000Z',
      by: DIRECTOR,
      versionId: 'annex-1',
      versionName: 'Aneks 1',
      kind: 'APPROVED',
      comment: 'Przesunięcie środków z promocji na koordynację',
    },
    {
      id: 'h-5',
      at: '2026-10-01T07:50:00.000Z',
      by: ANNA,
      versionId: 'annex-2',
      versionName: 'Aneks 2',
      kind: 'CREATED',
      comment: null,
    },
    {
      id: 'h-6',
      at: '2026-10-02T14:05:00.000Z',
      by: ANNA,
      versionId: 'annex-2',
      versionName: 'Aneks 2',
      kind: 'EDITED',
      comment: null,
    },
    {
      id: 'h-7',
      at: '2026-10-02T14:20:00.000Z',
      by: ANNA,
      versionId: 'annex-2',
      versionName: 'Aneks 2',
      kind: 'SUBMITTED',
      comment: null,
    },
  ],
};
