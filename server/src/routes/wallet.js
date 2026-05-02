import express from 'express';
import axios from 'axios';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Get user's wallet accounts
router.get('/', verifyAuth, async (req, res) => {
  try {
    const wallets = await req.prisma.walletAccount.findMany({
      where: { userId: req.userId },
      orderBy: { isPrimary: 'desc' },
    });

    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add wallet account
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { publicAddress, label, isPrimary } = req.body;

    if (!publicAddress) {
      return res.status(400).json({ error: 'Public address required' });
    }

    const wallet = await req.prisma.walletAccount.create({
      data: {
        userId: req.userId,
        publicAddress,
        label: label || 'My Wallet',
        isPrimary: isPrimary || false,
      },
    });

    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get balance from Dune API
router.get('/balance/:publicAddress', verifyAuth, async (req, res) => {
  try {
    const { publicAddress } = req.params;

    // TODO: Integrate Dune Sim API to fetch real-time SOL/USDC balances
    // For now, return mock data
    const mockBalance = {
      sol: Math.random() * 10,
      usdc: Math.random() * 1000,
      totalUsd: Math.random() * 2000,
    };

    res.json(mockBalance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
