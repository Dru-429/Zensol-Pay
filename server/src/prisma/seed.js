import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const users = [];
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@example.com`,
        username: `demouser${i + 1}`,
        passwordHash: await bcrypt.hash('password123', 10),
        profile: {
          create: {
            fullName: `Demo User ${i + 1}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
            bio: `I love Solana payments! 🚀`,
            trustScore: 95,
          },
        },
      },
      include: { profile: true },
    });
    users.push(user);
    console.log(`✓ Created user: ${user.username}`);
  }

  // Add wallet accounts
  const walletAddresses = [
    'So11111111111111111111111111111111111111112',
    '7xKXtg2CW87d98jJC2U3B4P2cFnwGdZMgLnokNBpVwn',
    '8dDAp82XvQFZqoVnqwZ9UjhELHAkMhZQVKjCZ2PQXCQ',
  ];

  for (let i = 0; i < users.length; i++) {
    await prisma.walletAccount.create({
      data: {
        userId: users[i].id,
        publicAddress: walletAddresses[i],
        label: 'Primary Wallet',
        isPrimary: true,
      },
    });
  }

  // Create contacts (user 1 adds user 2 and 3)
  await prisma.contact.create({
    data: {
      ownerId: users[0].id,
      contactUserId: users[1].id,
      displayName: 'Demo User 2',
      isRecent: true,
    },
  });

  await prisma.contact.create({
    data: {
      ownerId: users[0].id,
      contactUserId: users[2].id,
      displayName: 'Demo User 3',
      isRecent: true,
    },
  });

  console.log('✓ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
