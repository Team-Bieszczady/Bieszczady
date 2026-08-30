import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_USER_MODULES = ['OVERVIEW', 'TASKS', 'CALENDAR'];

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
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash,
        isDirector: false,
        mustChangePassword: false,
      },
    });
    for (const module of DEFAULT_USER_MODULES) {
      await prisma.userModuleAccess.upsert({
        where: { userId_module: { userId: user.id, module } },
        update: {},
        create: {
          userId: user.id,
          module,
          grantedById: director1Id!,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
