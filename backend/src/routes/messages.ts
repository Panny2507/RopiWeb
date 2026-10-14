import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateMessage } from '../middleware/validate';
import { createAuditLog } from '../lib/audit';

const router = Router();

// POST /api/messages - Üzenet küldése (nyilvános, nincs auth)
router.post('/', validateMessage, async (req: Request, res: Response) => {
  try {
    const { senderName, senderEmail, subject, body } = req.body;

    const message = await prisma.message.create({
      data: {
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
        isRead: false,
      },
    });

    await createAuditLog({
      action: 'MESSAGE_SENT',
      details: `Új kapcsolatfelvételi üzenet: "${message.subject}" tőle: ${message.senderName} (${message.senderEmail})`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Üzenet sikeresen elküldve! Munkatársunk hamarosan felveszi Önnel a kapcsolatot.',
      data: message,
    });
  } catch (error) {
    console.error('Üzenetküldési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az üzenet küldése során' });
  }
});

// GET /api/messages - Összes üzenet listázása (csak ADMIN)
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Üzenetek lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az üzenetek lekérése során' });
  }
});

// PATCH /api/messages/:id/read - Üzenet megjelölése olvasottként (csak ADMIN)
router.patch('/:id/read', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Érvénytelen üzenet azonosító' });
    }

    const existing = await prisma.message.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Az üzenet nem található' });
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { isRead: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'MESSAGE_MARK_READ',
      details: `Üzenet olvasottnak jelölve: #${id} "${existing.subject}"`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(200).json({
      message: 'Üzenet sikeresen olvasottnak jelölve',
      data: updated,
    });
  } catch (error) {
    console.error('Üzenet frissítési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az üzenet állapotának frissítése során' });
  }
});

export default router;
