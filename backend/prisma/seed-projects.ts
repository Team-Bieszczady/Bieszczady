import { PrismaClient } from '@prisma/client';

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
  },
];

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
      await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        update: { projectRole: member.role },
        create: {
          id: id('member', `${project.key}:${member.person}`),
          projectId,
          userId,
          projectRole: member.role,
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
  }
}
