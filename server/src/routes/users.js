import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const usersRouter = Router();

/** Resolve @username → primary Solana public key */
usersRouter.get('/resolve', async (req, res) => {
  try {
    let q = req.query.username || req.query.q;
    if (!q) return res.status(400).json({ error: 'username required' });
    q = String(q).replace(/^@/, '').toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username: q },
      include: {
        wallets: { where: { is_primary: true }, take: 1 },
        profile: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const primary = user.wallets[0] || (await prisma.walletAccount.findFirst({ where: { userId: user.id } }));
    if (!primary) return res.status(404).json({ error: 'No wallet on file' });
    res.json({
      userId: user.id,
      username: user.username,
      public_address: primary.public_address,
      full_name: user.profile?.full_name,
      avatar_url: user.profile?.avatar_url,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Lookup failed' });
  }
});

usersRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: true,
        wallets: true,
        receivedTransfers: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({
      id: user.id,
      username: user.username,
      profile: user.profile,
      wallets: user.wallets,
      recentTransfers: user.receivedTransfers,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});
