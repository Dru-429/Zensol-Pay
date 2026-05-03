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
    const msg = await prisma.message.create({
      data: {
        sender_id: req.user.sub,
        receiver_id,
        text: String(text),
        related_transfer_id: related_transfer_id || null,
      },
    });
    res.json(msg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
