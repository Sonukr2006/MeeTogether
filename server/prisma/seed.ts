import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { AccountState, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDevUser() {
  const passwordHash = await bcrypt.hash('StrongPass123!', 12);

  await prisma.user.upsert({
    where: { email: 'dev@meetogether.local' },
    update: {
      name: 'MeeTogether Dev',
      username: 'devadmin',
      passwordHash,
      accountState: AccountState.ACTIVE,
      emailVerified: true,
      openTo: [],
    },
    create: {
      name: 'MeeTogether Dev',
      username: 'devadmin',
      email: 'dev@meetogether.local',
      passwordHash,
      title: 'Development bootstrap user',
      bio: 'Created by prisma seed for local development only.',
      location: 'Local',
      openTo: [],
      accountState: AccountState.ACTIVE,
      emailVerified: true,
    },
  });

  console.log('Seeded minimal development user: dev@meetogether.local');
}

async function main() {
  const mode = process.env.SEED_MODE ?? 'none';

  if (mode === 'none') {
    console.log(
      'Prisma seed skipped. No sample app data will be inserted. Set SEED_MODE=dev-user to create a minimal local bootstrap user.',
    );
    return;
  }

  if (mode === 'dev-user') {
    await seedDevUser();
    return;
  }

  throw new Error(
    `Unsupported SEED_MODE "${mode}". Supported values: "none", "dev-user".`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
