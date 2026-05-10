import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { delKeys, getOrSet } from '../lib/cache.js';

export const messagesRouter = Router();
messagesRouter.use(authMiddleware);

messagesRouter.get('/with/:userId', async (req, res) => {
  try {
    const other = req.params.userId;
    const me = req.user.sub;
    const isPubkey = other.length > 30;
    const key = `messages:with:${me}:${other}`;
    const messages = await getOrSet(key, 8, () =>
      prisma.message.findMany({
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
        include: { transfer: true },
      })
    );
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
    const isPubkey = receiver_id.length > 30;

    const sender = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, username: true },
    });
    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    let receiver = null;
    if (!isPubkey) {
      receiver = await prisma.user.findUnique({
        where: { id: receiver_id },
        select: { id: true, username: true },
      });
      if (!receiver) return res.status(404).json({ error: 'Receiver not found' });
    }

    const msg = await prisma.message.create({
      data: {
        sender_id: req.user.sub,
        receiver_id: isPubkey ? null : receiver_id,
        receiver_pubkey: isPubkey ? receiver_id : null,
        text: String(text),
        related_transfer_id: related_transfer_id || null,
      },
    });

    if (!isPubkey && sender.id !== receiver.id) {
      // Update sender's contact
      const c1 = await prisma.contact.findFirst({ where: { owner_id: sender.id, contact_user_id: receiver.id } });
      if (c1) {
        await prisma.contact.update({ where: { id: c1.id }, data: { is_recent: true } });
      } else {
        await prisma.contact.create({
          data: { owner_id: sender.id, contact_user_id: receiver.id, display_name: receiver.username, is_recent: true }
        });
      }
      
      // Update receiver's contact
      const c2 = await prisma.contact.findFirst({ where: { owner_id: receiver.id, contact_user_id: sender.id } });
      if (c2) {
        await prisma.contact.update({ where: { id: c2.id }, data: { is_recent: true } });
      } else {
        await prisma.contact.create({
          data: { owner_id: receiver.id, contact_user_id: sender.id, display_name: sender.username, is_recent: true }
        });
      }
    } else if (isPubkey) {
      const c = await prisma.contact.findFirst({ where: { owner_id: sender.id, saved_pubkey: receiver_id } });
      if (c) {
        await prisma.contact.update({ where: { id: c.id }, data: { is_recent: true } });
      } else {
        await prisma.contact.create({
          data: { owner_id: sender.id, saved_pubkey: receiver_id, display_name: `${receiver_id.slice(0, 4)}...${receiver_id.slice(-4)}`, is_recent: true }
        });
      }
    }

    delKeys([
      `messages:with:${sender.id}:${receiver_id}`,
      `messages:with:${receiver_id}:${sender.id}`,
      `contacts:list:${sender.id}`,
      receiver ? `contacts:list:${receiver.id}` : null,
    ]);
    res.json(msg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});
