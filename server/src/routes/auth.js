import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { signToken, getCookieName } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { email, username, password, full_name, public_address } = req.body || {};
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username, and password required' });
    }
    const uname = String(username).replace(/^@/, '').toLowerCase();
    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: uname }] },
    });
    if (exists) return res.status(409).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        username: uname,
        password_hash,
        profile: { create: { full_name: full_name || uname } },
        wallets: public_address
          ? {
              create: {
                public_address: String(public_address),
                label: 'Primary',
                is_primary: true,
              },
            }
          : undefined,
      },
      include: { profile: true, wallets: true },
    });

    const token = signToken({ sub: user.id, username: user.username });
    res.cookie(getCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        wallets: user.wallets,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      include: { profile: true, wallets: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ sub: user.id, username: user.username });
    res.cookie(getCookieName(), token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        wallets: user.wallets,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/logout', (req, res) => {
  res.clearCookie(getCookieName());
  res.json({ ok: true });
});

import { refreshUserTrustScore } from '../services/trustScore.js';

authRouter.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  let token = null;
  if (header?.startsWith('Bearer ')) token = header.slice(7);
  if (!token && req.cookies?.[getCookieName()]) token = req.cookies[getCookieName()];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, wallets: true },
    });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    // Trigger background refresh of trust score (will only run if > 3 days old)
    refreshUserTrustScore(user.id).catch(e => console.error('Background Trust Score Error:', e));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        profile: user.profile,
        wallets: user.wallets,
      },
    });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});
