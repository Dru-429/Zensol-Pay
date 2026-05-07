import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

messagesRouter.get('/with/:userId', async (req, res) => {
  try {
    const other = req.params.userId;
    const me = req.user.sub;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: me, receiver_id: other },
          { sender_id: other, receiver_id: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: { transfer: true },
    });
    res.json({ messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

messagesRouter.post('/', async (req, res) => {
  try {
    const { receiver_id, text, related_transfer_id } = req.body || {};
    if (!receiver_id || !text) {
      return res.status(400).json({ error: 'receiver_id and text required' });
    }
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { id: true, username: true },
      }),
      prisma.user.findUnique({
        where: { id: receiver_id },
        select: { id: true, username: true },
      }),
    ]);
    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }
    const msg = await prisma.message.create({
      data: {
        sender_id: req.user.sub,
        receiver_id,
        text: String(text),
        related_transfer_id: related_transfer_id || null,
      },
    });
    await prisma.contact.upsert({
      where: {
        owner_id_contact_user_id: { owner_id: sender.id, contact_user_id: receiver.id },
      },
      create: {
        owner_id: sender.id,
        contact_user_id: receiver.id,
        display_name: receiver.username,
        is_recent: true,
      },
      update: {
        is_recent: true,
      },
    });
    await prisma.contact.upsert({
      where: {
        owner_id_contact_user_id: { owner_id: receiver.id, contact_user_id: sender.id },
      },
      create: {
        owner_id: receiver.id,
        contact_user_id: sender.id,
        display_name: sender.username,
        is_recent: true,
      },
      update: {
        is_recent: true,
      },
    });
    res.json(msg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
