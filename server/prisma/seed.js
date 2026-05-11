import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Keypair } from '@solana/web3.js';

const prisma = new PrismaClient();

function kp() {
  return Keypair.generate().publicKey.toBase58();
}

async function main() {
  const password_hash = await bcrypt.hash('demo1234', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@zensolpay.demo' },
    update: {},
    create: {
      email: 'alice@zensolpay.demo',
      username: 'alice',
      password_hash,
      profile: {
        create: {
          full_name: 'Alice Builder',
          bio: 'Hackathon mode',
          trust_score: 100,
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        },
      },
      wallets: {
        create: {
          public_address: kp(),
          label: 'Primary',
          is_primary: true,
        },
      },
    },
    include: { wallets: true },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@zensolpay.demo' },
    update: {},
    create: {
      email: 'bob@zensolpay.demo',
      username: 'bob',
      password_hash,
      profile: {
        create: {
          full_name: 'Bob Pay',
          trust_score: 98,
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
        },
      },
      wallets: {
        create: {
          public_address: kp(),
          label: 'Primary',
          is_primary: true,
        },
      },
    },
    include: { wallets: true },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@zensolpay.demo' },
    update: {},
    create: {
      email: 'carol@zensolpay.demo',
      username: 'carol',
      password_hash,
      profile: {
        create: {
          full_name: 'Carol Dev',
          trust_score: 102,
          avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
        },
      },
      wallets: {
        create: {
          public_address: kp(),
          label: 'Primary',
          is_primary: true,
        },
      },
    },
    include: { wallets: true },
  });

  await prisma.contact.upsert({
    where: { owner_id_contact_user_id: { owner_id: alice.id, contact_user_id: bob.id } },
    update: { is_recent: true, display_name: 'Bob Pay' },
    create: {
      owner_id: alice.id,
      contact_user_id: bob.id,
      display_name: 'Bob Pay',
      is_recent: true,
    },
  });

  await prisma.contact.upsert({
    where: { owner_id_contact_user_id: { owner_id: alice.id, contact_user_id: carol.id } },
    update: { is_recent: true, display_name: 'Carol Dev' },
    create: {
      owner_id: alice.id,
      contact_user_id: carol.id,
      display_name: 'Carol Dev',
      is_recent: true,
    },
  });

  await prisma.contact.upsert({
    where: { owner_id_contact_user_id: { owner_id: bob.id, contact_user_id: alice.id } },
    update: { is_recent: false },
    create: {
      owner_id: bob.id,
      contact_user_id: alice.id,
      display_name: 'Alice Builder',
      is_recent: false,
    },
  });

  const t1 = await prisma.transfer.create({
    data: {
      sender_id: alice.id,
      receiver_id: bob.id,
      amount_ui: '0.5',
      amount_usd: 75,
      status: 'completed',
      is_private: false,
      tx_hash: 'demo_tx_' + Date.now(),
    },
  });

  await prisma.message.create({
    data: {
      sender_id: alice.id,
      receiver_id: bob.id,
      text: 'Sent you SOL for lunch 🌮',
      related_transfer_id: t1.id,
    },
  });

  await prisma.message.create({
    data: {
      sender_id: bob.id,
      receiver_id: alice.id,
      text: 'Thanks! Received.',
    },
  });

  console.log('Seed OK. Demo login: alice@zensolpay.demo / demo1234');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
