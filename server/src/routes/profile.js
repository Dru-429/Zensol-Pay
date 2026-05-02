import express from 'express';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        profile: true,
        walletAccounts: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search user by username
router.get('/search/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await req.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        profile: true,
        walletAccounts: {
          where: { isPrimary: true },
          select: { publicAddress: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.patch('/', verifyAuth, async (req, res) => {
  try {
    const { fullName, avatarUrl, bio } = req.body;

    const profile = await req.prisma.userProfile.update({
      where: { userId: req.userId },
      data: { fullName, avatarUrl, bio },
    });

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
