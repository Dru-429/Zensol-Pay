import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';

export const usersRouter = Router();
const LINKS_MARKER = '\n\n---links---\n';

function parseProfileBio(rawBio) {
  if (!rawBio) return { bio: '', links: [] };
  const [bioPart, linksPart] = String(rawBio).split(LINKS_MARKER);
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
  return `${cleanBio}${LINKS_MARKER}${body}`.trim();
}

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
