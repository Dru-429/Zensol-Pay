import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const transfersRouter = Router();
transfersRouter.use(authMiddleware);

transfersRouter.post('/', async (req, res) => {
  try {
    const { receiver_id, amount_ui, amount_usd, status, is_private, tx_hash } = req.body || {};
    if (!receiver_id || amount_ui == null) {
      return res.status(400).json({ error: 'receiver_id and amount_ui required' });
    }
    const recv = await prisma.user.findUnique({ where: { id: receiver_id } });
    if (!recv) return res.status(404).json({ error: 'Receiver not found' });

    const transfer = await prisma.transfer.create({
      data: {
        sender_id: req.user.sub,
        receiver_id,
        amount_ui: String(amount_ui),
        amount_usd: amount_usd != null ? Number(amount_usd) : null,
        status: status || 'completed',
        is_private: !!is_private,
        tx_hash: tx_hash || null,
      },
    });
    await prisma.contact.updateMany({
      where: { owner_id: req.user.sub, contact_user_id: receiver_id },
      data: { is_recent: true },
    });
    await prisma.contact.updateMany({
      where: { owner_id: receiver_id, contact_user_id: req.user.sub },
      data: { is_recent: true },
    });
    res.json(transfer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record transfer' });
  }
});

transfersRouter.get('/with/:userId', async (req, res) => {
  try {
    const other = req.params.userId;
    const me = req.user.sub;
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [
          { sender_id: me, receiver_id: other },
          { sender_id: other, receiver_id: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ transfers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

transfersRouter.get('/mine', async (req, res) => {
  try {
    const me = req.user.sub;
    const transfers = await prisma.transfer.findMany({
      where: {
        OR: [{ sender_id: me }, { receiver_id: me }],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
    });
    res.json({ transfers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load transfers' });
  }
});
