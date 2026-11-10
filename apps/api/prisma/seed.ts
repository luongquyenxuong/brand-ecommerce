import { resolve } from 'node:path';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({
  path: resolve(process.cwd(), '../../.env'),
});

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing DATABASE_URL');
  }

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.appSetting.upsert({
      where: { key: 'store_name' },
      update: {},
      create: {
        key: 'store_name',
        value: 'Brand Commerce',
      },
    });

    console.log('Seed completed');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});
