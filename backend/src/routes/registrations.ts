import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireUserOrAdmin } from '../middleware/auth';
import { createAuditLog } from '../lib/audit';

const router = Router();

// POST /api/registrations - Jelentkezés edzésre (USER/ADMIN)
// Kezeli: létszámkorlát (ACCEPTED vs WAITLISTED), duplikáció szűrés (EF-4: HTTP 409)
router.post('/', authenticateToken, requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const { trainingId } = req.body;

    if (!trainingId) {
      return res.status(400).json({ error: 'Az edzés azonosító (trainingId) megadása kötelező' });
    }

    const tId = parseInt(trainingId, 10);
    if (isNaN(tId)) {
      return res.status(400).json({ error: 'Érvénytelen edzés azonosító' });
    }

    // Check training exists
    const training = await prisma.training.findUnique({
      where: { id: tId },
    });

    if (!training) {
      return res.status(404).json({ error: 'Az edzés nem található' });
    }

    // EF-4: Duplikáció ellenőrzés - HTTP 409
    const existing = await prisma.registration.findUnique({
      where: {
        trainingId_userId: {
          trainingId: tId,
          userId: req.user!.id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'Már regisztráltál erre az edzésre' });
    }

    // Tranzakcióban kezeljük a létszámot és a regisztráció létrehozását
    const result = await prisma.$transaction(async (tx) => {
      const acceptedCount = await tx.registration.count({
        where: {
          trainingId: tId,
          status: 'ACCEPTED',
        },
      });

      const totalRegistrations = await tx.registration.count({
        where: {
          trainingId: tId,
        },
      });

      const isAccepted = acceptedCount < training.maxParticipants;
      const status = isAccepted ? 'ACCEPTED' : 'WAITLISTED';
      const position = totalRegistrations + 1;

      const reg = await tx.registration.create({
        data: {
          trainingId: tId,
          userId: req.user!.id,
          status,
          position,
        },
        include: {
          training: true,
          user: {
            select: { id: true, name: true, email: true, neptunCode: true, position: true },
          },
        },
      });

      return { reg, status, acceptedCount, maxParticipants: training.maxParticipants };
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'REGISTRATION_CREATE',
      details: `Jelentkezés az edzésre (#${training.id} "${training.title}"): státusz=${result.status}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    const message =
      result.status === 'ACCEPTED'
        ? 'Sikeresen jelentkeztél az edzésre!'
        : 'Az edzés létszáma betelt, felkerültél a várólistára.';

    return res.status(201).json({
      message,
      registration: result.reg,
    });
  } catch (error) {
    console.error('Jelentkezési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a jelentkezés során' });
  }
});

// DELETE /api/registrations/:trainingId - Jelentkezés lemondása (USER/ADMIN)
// Kezeli: lemondás, és ha ACCEPTED volt a felhasználó, az első várólistás automatikus előreléptetése
router.delete('/:trainingId', authenticateToken, requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const trainingId = parseInt(req.params.trainingId, 10);
    if (isNaN(trainingId)) {
      return res.status(400).json({ error: 'Érvénytelen edzés azonosító' });
    }

    const existing = await prisma.registration.findUnique({
      where: {
        trainingId_userId: {
          trainingId,
          userId: req.user!.id,
        },
      },
      include: {
        training: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Nem található jelentkezés erre az edzésre' });
    }

    const wasAccepted = existing.status === 'ACCEPTED';

    const transactionResult = await prisma.$transaction(async (tx) => {
      // Töröljük a jelentkezést
      await tx.registration.delete({
        where: { id: existing.id },
      });

      let promotedRegistration = null;

      // Ha elfogadott résztvevő lépett vissza, a várólistáról léptessük elő az elsőt
      if (wasAccepted) {
        const nextWaitlisted = await tx.registration.findFirst({
          where: {
            trainingId,
            status: 'WAITLISTED',
          },
          orderBy: { position: 'asc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        if (nextWaitlisted) {
          promotedRegistration = await tx.registration.update({
            where: { id: nextWaitlisted.id },
            data: { status: 'ACCEPTED' },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          });
        }
      }

      return { promotedRegistration };
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'REGISTRATION_CANCEL',
      details: `Jelentkezés visszavonva az edzésről (#${trainingId} "${existing.training.title}")`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    let message = 'Jelentkezés sikeresen visszavonva';
    if (transactionResult.promotedRegistration) {
      message += ` (a várólistáról előrelépett: ${transactionResult.promotedRegistration.user.name})`;
    }

    return res.status(200).json({
      message,
      promotedUser: transactionResult.promotedRegistration?.user || null,
    });
  } catch (error) {
    console.error('Jelentkezés visszavonási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a jelentkezés lemondása során' });
  }
});

// GET /api/registrations/my - Saját jelentkezések lekérése
router.get('/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: req.user!.id },
      include: {
        training: {
          include: {
            creator: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Saját jelentkezések lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a jelentkezések lekérése során' });
  }
});

export default router;
