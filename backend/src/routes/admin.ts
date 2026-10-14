import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { createAuditLog } from '../lib/audit';

const router = Router();

// Minden admin végpont védett: csak bejelentkezett ADMIN érheti el (EF-5 védelem)
router.use(authenticateToken, requireAdmin);

// GET /api/admin/users - Felhasználók listája statisztikákkal
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        neptunCode: true,
        isActiveMember: true,
        position: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            registrations: true,
            trainings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Felhasználók listázási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a felhasználók listázása során' });
  }
});

// PATCH /api/admin/users/:id - Felhasználó szerepkör, státusz, pozíció módosítása
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Érvénytelen felhasználó azonosító' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return res.status(404).json({ error: 'A felhasználó nem található' });
    }

    const { role, isActiveMember, position, name, neptunCode } = req.body;

    const updateData: any = {};

    if (role !== undefined) {
      const validRoles = ['GUEST', 'USER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `A szerepkör csak az alábbiak egyike lehet: ${validRoles.join(', ')}` });
      }
      updateData.role = role;
    }

    if (isActiveMember !== undefined) {
      updateData.isActiveMember = Boolean(isActiveMember);
    }

    if (position !== undefined) {
      updateData.position = position ? String(position).trim() : null;
    }

    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'A név nem lehet üres' });
      }
      updateData.name = name.trim();
    }

    if (neptunCode !== undefined) {
      updateData.neptunCode = neptunCode ? String(neptunCode).trim().toUpperCase() : null;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        neptunCode: true,
        isActiveMember: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'USER_UPDATE_BY_ADMIN',
      details: `Felhasználó (#${id} ${updated.email}) módosítva az admin által: ${JSON.stringify(updateData)}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(200).json({
      message: 'Felhasználó sikeresen frissítve!',
      user: updated,
    });
  } catch (error) {
    console.error('Felhasználó módosítási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a felhasználó módosítása során' });
  }
});

// GET /api/admin/audit-log - Rendszer audit napló lekérése
router.get('/audit-log', async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      take: 200, // legfrissebb 200 bejegyzés
    });

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Audit log lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt az audit napló lekérése során' });
  }
});

export default router;
