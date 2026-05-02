import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { processSolanaTransfer, processPrivateTransfer } from '../services/web3.js';

const router = express.Router();

// Create a standard or private transfer
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { receiverId, amountUi, amountUsd, isPrivate, receiverUsername } = req.body;

    // Resolve receiver by username if provided
    let finalReceiverId = receiverId;
    if (receiverUsername && !receiverId) {
      const receiver = await req.prisma.user.findUnique({
        where: { username: receiverUsername },
      });
      if (!receiver) {
        return res.status(404).json({ error: 'Receiver not found' });
      }
      finalReceiverId = receiver.id;
    }

    if (!finalReceiverId || !amountUi) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get sender and receiver wallet info
    const sender = await req.prisma.user.findUnique({
      where: { id: req.userId },
      include: { walletAccounts: { where: { isPrimary: true } } },
    });

    const receiver = await req.prisma.user.findUnique({
      where: { id: finalReceiverId },
      include: { walletAccounts: { where: { isPrimary: true } } },
    });

    if (!sender?.walletAccounts[0] || !receiver?.walletAccounts[0]) {
      return res.status(400).json({ error: 'Wallet not configured' });
    }

    // Create transfer record
    const transfer = await req.prisma.transfer.create({
      data: {
        senderId: req.userId,
        receiverId: finalReceiverId,
        amountUi,
        amountUsd,
        isPrivate,
        status: 'pending',
      },
    });

    // Execute transfer
    let txHash, cloakDepositHash;
    if (isPrivate) {
      // Private transfer using Cloak
      cloakDepositHash = await processPrivateTransfer(
        sender.walletAccounts[0].publicAddress,
        receiver.walletAccounts[0].publicAddress,
        amountUi
      );
      txHash = cloakDepositHash;
    } else {
      // Standard Solana transfer
      txHash = await processSolanaTransfer(
        sender.walletAccounts[0].publicAddress,
        receiver.walletAccounts[0].publicAddress,
        amountUi
      );
    }

    // Update transfer status
    const updatedTransfer = await req.prisma.transfer.update({
      where: { id: transfer.id },
      data: {
        txHash,
        cloakDepositHash,
        status: 'completed',
      },
    });

    res.status(201).json(updatedTransfer);
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transfer history between two users
router.get('/history/:contactId', verifyAuth, async (req, res) => {
  try {
    const { contactId } = req.params;

    const transfers = await req.prisma.transfer.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: contactId },
          { senderId: contactId, receiverId: req.userId },
        ],
      },
      include: {
        sender: { select: { id: true, username: true } },
        receiver: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
