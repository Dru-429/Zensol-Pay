import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { delKeys, getOrSet } from '../lib/cache.js';

export const contactsRouter = Router();
contactsRouter.use(authMiddleware);

contactsRouter.get('/', async (req, res) => {
  try {
    const ownerId = req.user.sub;
    const key = `contacts:list:${ownerId}`;
    const list = await getOrSet(key, 10, () =>
      prisma.contact.findMany({
        where: { owner_id: ownerId },
        include: {
          contactUser: { include: { profile: true, wallets: { where: { is_primary: true }, take: 1 } } },
        },
        orderBy: [{ is_recent: 'desc' }, { display_name: 'asc' }],
      })
    );
    res.json({ contacts: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load contacts' });
  }
});

contactsRouter.post('/', async (req, res) => {
  try {
    const { contact_user_id, display_name, is_recent } = req.body || {};
    if (!contact_user_id) return res.status(400).json({ error: 'contact_user_id required' });
    const other = await prisma.user.findUnique({ where: { id: contact_user_id } });
    if (!other) return res.status(404).json({ error: 'User not found' });
    if (other.id === req.user.sub) return res.status(400).json({ error: 'Cannot add self' });

    const row = await prisma.contact.upsert({
      where: {
        owner_id_contact_user_id: { owner_id: req.user.sub, contact_user_id: other.id },
      },
      create: {
        owner_id: req.user.sub,
        contact_user_id: other.id,
        display_name: display_name || other.username,
        is_recent: !!is_recent,
      },
      update: {
        display_name: display_name || undefined,
        is_recent: is_recent ?? undefined,
      },
      include: { contactUser: { include: { profile: true } } },
    });
    delKeys([`contacts:list:${req.user.sub}`]);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});
