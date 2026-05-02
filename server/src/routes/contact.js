import express from 'express';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all contacts
router.get('/', verifyAuth, async (req, res) => {
  try {
    const contacts = await req.prisma.contact.findMany({
      where: { ownerId: req.userId },
      include: {
        contactUser: {
          select: { id: true, username: true, email: true, profile: true },
        },
      },
      orderBy: { isRecent: 'desc' },
    });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add contact
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { contactUsername, displayName } = req.body;

    // Find the contact user by username
    const contactUser = await req.prisma.user.findUnique({
      where: { username: contactUsername },
    });

    if (!contactUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create contact
    const contact = await req.prisma.contact.create({
      data: {
        ownerId: req.userId,
        contactUserId: contactUser.id,
        displayName: displayName || contactUser.username,
      },
      include: {
        contactUser: {
          select: { id: true, username: true, email: true, profile: true },
        },
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark contact as recent
router.patch('/:contactId/recent', verifyAuth, async (req, res) => {
  try {
    const { contactId } = req.params;

    const contact = await req.prisma.contact.update({
      where: {
        ownerId_contactUserId: {
          ownerId: req.userId,
          contactUserId: contactId,
        },
      },
      data: { isRecent: true },
    });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
