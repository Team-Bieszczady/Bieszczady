import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);

  const users = [
    {
      email: 'director@bieszczady.local',
      firstName: 'Director',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'DIRECTOR' as const,
      accountStatus: 'ACTIVE' as const,
    },
    {
      email: 'coordinator@bieszczady.local',
      firstName: 'Coordinator',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'COORDINATOR' as const,
      accountStatus: 'ACTIVE' as const,
    },
    {
      email: 'executor@bieszczady.local',
      firstName: 'Executor',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'EXECUTOR' as const,
      accountStatus: 'ACTIVE' as const,
    },
    {
      email: 'partner@bieszczady.local',
      firstName: 'Partner',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'PARTNER' as const,
      accountStatus: 'ACTIVE' as const,
    },
    {
      email: 'inactive.user@bieszczady.local',
      firstName: 'Inactive',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'EXECUTOR' as const,
      accountStatus: 'INACTIVE' as const,
    },
    {
      email: 'deleted.user@bieszczady.local',
      firstName: 'Deleted',
      lastName: 'User',
      passwordHash: hashedPassword,
      role: 'COORDINATOR' as const,
      accountStatus: 'DELETED' as const,
      deletedAt: new Date(),
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log('Seed completed. Created 6 sample users.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
