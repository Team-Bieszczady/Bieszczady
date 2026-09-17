import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PROJECTS, seedProjects, upsertUserWithModules } from './seed-projects';
import { DEFAULT_USER_MODULES } from '../src/common/enums/module.enum';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const directors = [
    {
      email: 'director1@bieszczady.local',
      firstName: 'Director',
      lastName: 'One',
    },
    {
      email: 'director2@bieszczady.local',
      firstName: 'Director',
      lastName: 'Two',
    },
    {
      email: 'director3@bieszczady.local',
      firstName: 'Director',
      lastName: 'Three',
    },
  ];

  let director1Id: string;

  for (const d of directors) {
    const created = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        ...d,
        passwordHash,
        isDirector: true,
        accountStatus: 'ACTIVE',
        mustChangePassword: false,
      },
    });
    if (d.email === 'director1@bieszczady.local') {
      director1Id = created.id;
    }
  }

  const regularUsers = [
    {
      email: 'active.user@bieszczady.local',
      firstName: 'Active',
      lastName: 'User',
      accountStatus: 'ACTIVE',
    },
    {
      email: 'inactive.user@bieszczady.local',
      firstName: 'Inactive',
      lastName: 'User',
      accountStatus: 'INACTIVE',
    },
    {
      email: 'deleted.user@bieszczady.local',
      firstName: 'Deleted',
      lastName: 'User',
      accountStatus: 'ACTIVE',
      deletedAt: new Date(),
    },
  ];

  for (const u of regularUsers) {
    await upsertUserWithModules(prisma, {
      ...u,
      passwordHash,
      modules: DEFAULT_USER_MODULES,
      grantedById: director1Id!,
    });
  }

  await seedProjects(
    prisma,
    passwordHash,
    director1Id!,
    DEFAULT_USER_MODULES,
    PROJECTS,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
