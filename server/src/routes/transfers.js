import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { delKeys, getOrSet } from '../lib/cache.js';

export const transfersRouter = Router();
transfersRouter.use(authMiddleware);

transfersRouter.post('/', async (req, res) => {
  try {
    const { receiver_id, amount_ui, amount_usd, status, is_private, tx_hash } = req.body || {};
    if (!receiver_id || amount_ui == null) {
      return res.status(400).json({ error: 'receiver_id and amount_ui required' });
    }
    
    const isPubkey = receiver_id.length > 30;
    
    if (!isPubkey) {
      const recv = await prisma.user.findUnique({ where: { id: receiver_id } });
      if (!recv) return res.status(404).json({ error: 'Receiver not found' });
    }

    const transfer = await prisma.transfer.create({
      data: {
        sender_id: req.user.sub,
        receiver_id: isPubkey ? null : receiver_id,
        receiver_pubkey: isPubkey ? receiver_id : null,
        amount_ui: String(amount_ui),
        amount_usd: amount_usd != null ? Number(amount_usd) : null,
        status: status || 'completed',
        is_private: !!is_private,
        tx_hash: tx_hash || null,
      },
    });

    if (!isPubkey) {
      const c1 = await prisma.contact.findFirst({ where: { owner_id: req.user.sub, contact_user_id: receiver_id }});
      if (c1) await prisma.contact.update({ where: { id: c1.id }, data: { is_recent: true } });
      
      const c2 = await prisma.contact.findFirst({ where: { owner_id: receiver_id, contact_user_id: req.user.sub }});
      if (c2) await prisma.contact.update({ where: { id: c2.id }, data: { is_recent: true } });
    } else {
      const c = await prisma.contact.findFirst({ where: { owner_id: req.user.sub, saved_pubkey: receiver_id }});
      if (c) await prisma.contact.update({ where: { id: c.id }, data: { is_recent: true } });
    }

    delKeys([
      `transfers:mine:${req.user.sub}`,
      isPubkey ? null : `transfers:mine:${receiver_id}`,
      `transfers:with:${req.user.sub}:${receiver_id}`,
      `transfers:with:${receiver_id}:${req.user.sub}`,
      `contacts:list:${req.user.sub}`,
      isPubkey ? null : `contacts:list:${receiver_id}`,
    ]);
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
    const isPubkey = other.length > 30;
    const key = `transfers:with:${me}:${other}`;
    const transfers = await getOrSet(key, 8, () =>
      prisma.transfer.findMany({
        where: isPubkey 
          ? {
              OR: [
                { sender_id: me, receiver_pubkey: other }
              ]
            }
          : {
              OR: [
                { sender_id: me, receiver_id: other },
                { sender_id: other, receiver_id: me },
              ],
            },
        orderBy: { createdAt: 'asc' },
      })
    );
    res.json({ transfers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

transfersRouter.get('/mine', async (req, res) => {
  try {
    const me = req.user.sub;
    const key = `transfers:mine:${me}`;
    const transfers = await getOrSet(key, 12, () =>
      prisma.transfer.findMany({
        where: {
          OR: [{ sender_id: me }, { receiver_id: me }],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          sender: { select: { id: true, username: true } },
          receiver: { select: { id: true, username: true } },
        },
      })
    );
    res.json({ transfers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load transfers' });
  }
});
