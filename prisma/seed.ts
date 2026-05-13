import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ApiKey, User } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { Pool } from 'pg';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. Clean existing data (order matters!)
  console.log('Cleaning existing data...');
  await prisma.usageLog.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  console.log('Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all(
    Array.from({ length: 5 }).map(async (_, index) => {
      return prisma.user.create({
        data: {
          email: index === 0 ? 'admin@example.com' : faker.internet.email(),
          password: passwordHash,
          name: faker.person.fullName(),
        },
      });
    })
  );

  console.log(`✅ Created ${users.length} users.`);

  // 3. Create API Keys
  console.log('Creating API keys...');
  const apiKeys: ApiKey[] = [];
  for (const user of users) {
    const numKeys = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numKeys; i++) {
      const apiKey = await prisma.apiKey.create({
        data: {
          name: faker.commerce.productName() + ' Key',
          key: `sk_${faker.string.alphanumeric(32)}`,
          prefix: faker.string.alphanumeric(8),
          limit: faker.helpers.arrayElement([100, 500, 1000, 5000]),
          windowSec: faker.helpers.arrayElement([60, 300, 3600]),
          isActive: true,
          userId: user.id,
        },
      });
      apiKeys.push(apiKey);
    }
  }

  console.log(`✅ Created ${apiKeys.length} API keys.`);

  // 4. Create Usage Logs
  console.log('Creating usage logs...');
  const endpoints = ['/api/v1/users', '/api/v1/data', '/api/v1/auth', '/api/v1/metrics'];
  const statuses = [200, 200, 200, 201, 429, 401, 500];

  for (const apiKey of apiKeys) {
    const numLogs = faker.number.int({ min: 10, max: 50 });
    const logs = Array.from({ length: numLogs }).map(() => ({
      apiKeyId: apiKey.id,
      endpoint: faker.helpers.arrayElement(endpoints),
      status: faker.helpers.arrayElement(statuses),
      ip: faker.internet.ip(),
      createdAt: faker.date.recent({ days: 7 }),
    }));

    await prisma.usageLog.createMany({
      data: logs,
    });
  }

  console.log('✅ Created usage logs.');
  console.log('🏁 Seeding finished successfully!');
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  });
