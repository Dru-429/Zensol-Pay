import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { delKeys, getOrSet } from '../lib/cache.js';

export const usersRouter = Router();
const LINKS_MARKER = '\n\n---links---\n';

function parseProfileBio(rawBio) {
  if (!rawBio) return { bio: '', links: [] };
  const text = String(rawBio);
  const plainMarker = '---links---\n';
  const hasStandardMarker = text.includes(LINKS_MARKER);
  const hasPlainMarker = text.startsWith(plainMarker) || text.includes(`\n${plainMarker}`);
  const markerToUse = hasStandardMarker ? LINKS_MARKER : hasPlainMarker ? `\n${plainMarker}` : null;
  const [bioPart, linksPart] = markerToUse ? text.split(markerToUse) : [text, null];
  if (!linksPart) return { bio: String(rawBio), links: [] };
  const links = linksPart
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return { bio: (bioPart || '').trim(), links };
}

function serializeProfileBio(bio, links) {
  const cleanBio = String(bio || '').trim();
  const cleanLinks = Array.isArray(links)
    ? links.map((link) => String(link || '').trim()).filter(Boolean)
    : [];
  if (cleanLinks.length === 0) return cleanBio;
  const body = cleanLinks.join('\n');
  if (!cleanBio) return `---links---\n${body}`;
  return `${cleanBio}${LINKS_MARKER}${body}`;
}

usersRouter.get('/search', authMiddleware, async (req, res) => {
  try {
    const raw = String(req.query.q || req.query.query || '').trim();
    if (!raw) return res.json({ results: [] });
    const q = raw.replace(/^@/, '');
    const ownerId = req.user.sub;
    const cacheKey = `users:search:${ownerId}:${q.toLowerCase()}`;

    const results = await getOrSet(cacheKey, 12, async () => {
      const contactMatches = await prisma.contact.findMany({
        where: {
          owner_id: ownerId,
          OR: [
            { display_name: { contains: q, mode: 'insensitive' } },
            { contactUser: { username: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: {
          contactUser: {
            include: {
              profile: true,
              wallets: { where: { is_primary: true }, take: 1 },
            },
          },
        },
        orderBy: [{ is_recent: 'desc' }, { display_name: 'asc' }],
        take: 8,
      });

      const used = new Set();
      const tier1 = contactMatches.map((row) => {
        if (row.contactUser) {
          used.add(row.contactUser.id);
        }
        return {
          userId: row.contactUser?.id || row.saved_pubkey,
          username: row.contactUser?.username || row.saved_pubkey,
          full_name: row.contactUser?.profile?.full_name || null,
          display_name: row.display_name || null,
          public_address: row.saved_pubkey || row.contactUser?.wallets?.[0]?.public_address || null,
          source: 'contact',
        };
      });

      const globalMatches = await prisma.user.findMany({
        where: {
          id: { not: ownerId },
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { profile: { full_name: { contains: q, mode: 'insensitive' } } },
            { wallets: { some: { public_address: { contains: q, mode: 'insensitive' } } } },
          ],
        },
        include: {
          profile: true,
          wallets: { where: { is_primary: true }, take: 1 },
        },
        orderBy: { username: 'asc' },
        take: 12,
      });

      const tier2 = globalMatches
        .filter((u) => !used.has(u.id))
        .map((u) => ({
          userId: u.id,
          username: u.username,
          full_name: u.profile?.full_name || null,
          display_name: null,
          public_address: u.wallets?.[0]?.public_address || null,
          source: 'global',
        }));

      return [...tier1, ...tier2];
    });

    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Search failed' });
  }
});

/** Resolve @username → primary Solana public key */
usersRouter.get('/resolve', async (req, res) => {
  try {
    let q = req.query.username || req.query.q;
    if (!q) return res.status(400).json({ error: 'username required' });
    q = String(q).replace(/^@/, '').toLowerCase();
    const key = `users:resolve:${q}`;
    const user = await getOrSet(key, 60, () =>
      prisma.user.findUnique({
        where: { username: q },
        include: {
          wallets: { where: { is_primary: true }, take: 1 },
          profile: true,
        },
      })
    );
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
    const id = req.params.id;
    if (id && id.length > 30) {
      const contact = await prisma.contact.findFirst({
        where: { owner_id: req.user.sub, saved_pubkey: id }
      });
      return res.json({
        id: id,
        username: contact?.display_name?.replace(/\s+/g, '').toLowerCase() || 'external_user',
        profile: {
          full_name: contact?.display_name || 'External Wallet',
          bio: '',
          links: [],
          avatar_url: null
        },
        wallets: [{ public_address: id, is_primary: true }],
        recentTransfers: []
      });
    }

    const key = `users:profile:${req.params.id}`;
    const user = await getOrSet(key, 20, () =>
      prisma.user.findUnique({
        where: { id: req.params.id },
        include: {
          profile: true,
          wallets: true,
          receivedTransfers: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      })
    );
    if (!user) return res.status(404).json({ error: 'Not found' });
    const parsed = parseProfileBio(user.profile?.bio);
    res.json({
      id: user.id,
      username: user.username,
      profile: {
        ...user.profile,
        bio: parsed.bio,
        links: parsed.links,
      },
      wallets: user.wallets,
      recentTransfers: user.receivedTransfers,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

usersRouter.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const { full_name, avatar_url, bio, links } = req.body || {};
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.params.id },
      create: {
        userId: req.params.id,
        full_name: full_name ?? null,
        avatar_url: avatar_url ?? null,
        bio: serializeProfileBio(bio, links),
      },
      update: {
        full_name: full_name ?? undefined,
        avatar_url: avatar_url ?? undefined,
        bio: serializeProfileBio(bio, links),
      },
    });
    const parsed = parseProfileBio(profile.bio);
    delKeys([`users:profile:${req.params.id}`]);
    res.json({
      profile: {
        ...profile,
        bio: parsed.bio,
        links: parsed.links,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

usersRouter.put('/:id/primary-wallet', authMiddleware, async (req, res) => {
  try {
    if (req.user.sub !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const { wallet_id } = req.body || {};
    if (!wallet_id) return res.status(400).json({ error: 'wallet_id required' });

    await prisma.$transaction([
      prisma.walletAccount.updateMany({
        where: { userId: req.params.id },
        data: { is_primary: false },
      }),
      prisma.walletAccount.update({
        where: { id: wallet_id, userId: req.params.id },
        data: { is_primary: true },
      }),
    ]);

    delKeys([`users:profile:${req.params.id}`]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update primary wallet' });
  }
});
