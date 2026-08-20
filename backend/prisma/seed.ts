import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

  for (const d of directors) {
    await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        ...d,
        passwordHash,
        isDirector: true,
        accountStatus: 'ACTIVE',
      },
    });
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
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash, isDirector: false },
    });
  }

  console.log('Seed completed. Created 3 directors and 3 regular users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
