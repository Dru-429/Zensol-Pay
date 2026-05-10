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
    const { contact_user_id, saved_pubkey, display_name, is_recent } = req.body || {};
    if (!contact_user_id && !saved_pubkey) {
      return res.status(400).json({ error: 'contact_user_id or saved_pubkey required' });
    }

    let resolvedUserId = contact_user_id;
    let resolvedPubkey = saved_pubkey;

    if (contact_user_id) {
      const other = await prisma.user.findUnique({ where: { id: contact_user_id } });
      if (!other) return res.status(404).json({ error: 'User not found' });
      if (other.id === req.user.sub) return res.status(400).json({ error: 'Cannot add self' });
    } else if (saved_pubkey) {
      // If the pubkey actually belongs to a registered user, link to that user
      const wallet = await prisma.walletAccount.findFirst({
        where: { public_address: saved_pubkey },
        include: { user: true }
      });
      if (wallet && wallet.user) {
        if (wallet.userId === req.user.sub) return res.status(400).json({ error: 'Cannot add self' });
        resolvedUserId = wallet.userId;
        resolvedPubkey = null;
      }
    }

    let existing;
    if (resolvedUserId) {
      existing = await prisma.contact.findFirst({
        where: { owner_id: req.user.sub, contact_user_id: resolvedUserId }
      });
    } else if (resolvedPubkey) {
      existing = await prisma.contact.findFirst({
        where: { owner_id: req.user.sub, saved_pubkey: resolvedPubkey }
      });
    }

    let row;
    if (existing) {
      row = await prisma.contact.update({
        where: { id: existing.id },
        data: {
          display_name: display_name || undefined,
          is_recent: is_recent ?? undefined,
        },
        include: { contactUser: { include: { profile: true } } },
      });
    } else {
      row = await prisma.contact.create({
        data: {
          owner_id: req.user.sub,
          contact_user_id: resolvedUserId || null,
          saved_pubkey: resolvedPubkey || null,
          display_name: display_name || (resolvedPubkey ? `${resolvedPubkey.slice(0, 4)}...${resolvedPubkey.slice(-4)}` : 'Unknown'),
          is_recent: !!is_recent,
        },
        include: { contactUser: { include: { profile: true } } },
      });
    }

    delKeys([`contacts:list:${req.user.sub}`]);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save contact' });
  }
});
