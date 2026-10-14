import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateTraining } from '../middleware/validate';
import { createAuditLog } from '../lib/audit';

const router = Router();

// GET /api/trainings - Jövőbeli edzések listázása (nyilvános)
router.get('/', async (req: Request, res: Response) => {
  try {
    const includePast = req.query.includePast === 'true';

    // Start of current day (local/UTC) so today's trainings are visible
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause = includePast ? {} : { date: { gte: today } };

    const trainings = await prisma.training.findMany({
      where: whereClause,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                position: true,
                isActiveMember: true,
                neptunCode: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    const enrichedTrainings = trainings.map((t) => {
      const acceptedCount = t.registrations.filter((r) => r.status === 'ACCEPTED').length;
      const waitlistCount = t.registrations.filter((r) => r.status === 'WAITLISTED').length;
      const isFull = acceptedCount >= t.maxParticipants;
      const freeSlots = Math.max(0, t.maxParticipants - acceptedCount);

      return {
        ...t,
        acceptedCount,
        waitlistCount,
        isFull,
        freeSlots,
      };
    });

    return res.status(200).json(enrichedTrainings);
  } catch (error) {
    console.error('Edzések lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az edzések lekérése során' });
  }
});

// GET /api/trainings/:id - Egy edzés részletes adatai jelentkezőkkel
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Érvénytelen edzés azonosító' });
    }

    const training = await prisma.training.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                position: true,
                isActiveMember: true,
                neptunCode: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!training) {
      return res.status(404).json({ error: 'Az edzés nem található' });
    }

    const acceptedCount = training.registrations.filter((r) => r.status === 'ACCEPTED').length;
    const waitlistCount = training.registrations.filter((r) => r.status === 'WAITLISTED').length;

    return res.status(200).json({
      ...training,
      acceptedCount,
      waitlistCount,
      isFull: acceptedCount >= training.maxParticipants,
      freeSlots: Math.max(0, training.maxParticipants - acceptedCount),
    });
  } catch (error) {
    console.error('Edzés lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az edzés lekérése során' });
  }
});

// POST /api/trainings - Új edzés létrehozása (csak ADMIN, EF-3 validációval)
router.post('/', authenticateToken, requireAdmin, validateTraining, async (req: Request, res: Response) => {
  try {
    const { title, description, location, address, date, startTime, endTime, maxParticipants, type } = req.body;

    const parsedDate = new Date(date);
    const training = await prisma.training.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        location: location.trim(),
        address: address.trim(),
        date: parsedDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        maxParticipants: Number(maxParticipants),
        type: type.trim(),
        createdBy: req.user!.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'TRAINING_CREATE',
      details: `Új edzés létrehozva: #${training.id} "${training.title}" (${training.date.toISOString().split('T')[0]})`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Edzés sikeresen létrehozva!',
      training,
    });
  } catch (error) {
    console.error('Edzés létrehozási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az edzés létrehozása során' });
  }
});

// PUT /api/trainings/:id - Edzés módosítása (csak ADMIN)
router.put('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Érvénytelen edzés azonosító' });
    }

    const existing = await prisma.training.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Az edzés nem található' });
    }

    const { title, description, location, address, date, startTime, endTime, maxParticipants, type } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (location !== undefined) updateData.location = String(location).trim();
    if (address !== undefined) updateData.address = String(address).trim();
    if (startTime !== undefined) updateData.startTime = String(startTime).trim();
    if (endTime !== undefined) updateData.endTime = String(endTime).trim();
    if (type !== undefined) updateData.type = String(type).trim();

    if (maxParticipants !== undefined) {
      const max = Number(maxParticipants);
      if (!Number.isInteger(max) || max <= 0) {
        return res.status(400).json({ error: 'A maximális létszámnak pozitív egész számnak kell lennie' });
      }
      updateData.maxParticipants = max;
    }

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Érvénytelen dátum formátum' });
      }
      if (parsedDate.getTime() <= Date.now()) {
        return res.status(400).json({ error: 'Az edzés dátumának a jövőben kell lennie' });
      }
      updateData.date = parsedDate;
    }

    const updated = await prisma.training.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'TRAINING_UPDATE',
      details: `Edzés módosítva: #${id} "${updated.title}"`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(200).json({
      message: 'Edzés sikeresen frissítve!',
      training: updated,
    });
  } catch (error) {
    console.error('Edzés módosítási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az edzés módosítása során' });
  }
});

// DELETE /api/trainings/:id - Edzés törlése (csak ADMIN)
router.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Érvénytelen edzés azonosító' });
    }

    const existing = await prisma.training.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Az edzés nem található' });
    }

    await prisma.training.delete({ where: { id } });

    await createAuditLog({
      userId: req.user!.id,
      action: 'TRAINING_DELETE',
      details: `Edzés törölve: #${id} "${existing.title}"`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(200).json({ message: 'Edzés sikeresen törölve' });
  } catch (error) {
    console.error('Edzés törlési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az edzés törlése során' });
  }
});

export default router;
