import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin, requireUserOrAdmin } from '../middleware/auth';
import { validateCupTeam } from '../middleware/validate';
import { createAuditLog } from '../lib/audit';

const router = Router();

// GET /api/cup/teams - Röpikupa csapatok listázása
router.get('/teams', async (req: Request, res: Response) => {
  try {
    const { cupEdition } = req.query;

    const whereClause: any = {};
    if (cupEdition && typeof cupEdition === 'string') {
      whereClause.cupEdition = cupEdition;
    }

    const teams = await prisma.cupTeam.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { members: { orderBy: { createdAt: 'asc' } } },
    });

    return res.status(200).json(teams);
  } catch (error) {
    console.error('Kupa csapatok lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a kupa csapatok lekérése során' });
  }
});

// POST /api/cup/teams - Csapat nevezése a kupára (USER/ADMIN)
router.post('/teams', authenticateToken, requireUserOrAdmin, validateCupTeam, async (req: Request, res: Response) => {
  try {
    const { teamName, captainName, captainEmail, cupEdition, acceptedRules, members } = req.body;

    const normalizedMembers = members.map((member: any) => {
      if (typeof member === 'string') {
        return { name: member.trim(), isVik: false, isBme: false, isFemale: false };
      }
      return {
        name: String(member.name || '').trim(),
        isVik: Boolean(member.isVik),
        isBme: Boolean(member.isBme),
        isFemale: Boolean(member.isFemale),
      };
    }).filter((m: any) => m.name.length > 0);

    const team = await prisma.cupTeam.create({
      data: {
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim().toLowerCase(),
        captainUserId: req.user!.id,
        memberCount: normalizedMembers.length,
        category: (req.body.category && typeof req.body.category === 'string') ? req.body.category.trim() : 'Casual',
        cupEdition: cupEdition.trim(),
        acceptedRules: Boolean(acceptedRules),
        status: 'SUBMITTED',
        members: {
          create: normalizedMembers,
        },
      },
      include: { members: true },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CUP_TEAM_REGISTER',
      details: `Csapat nevezve a kupára: "${team.teamName}" (${team.cupEdition}, kategória: ${team.category})`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Csapat sikeresen regisztrálva a kupára!',
      team,
    });
  } catch (error) {
    console.error('Csapat nevezési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a csapat nevezése során' });
  }
});

// PATCH /api/cup/teams/:id/members - csapatnévsor módosítása a kapitánynak
router.patch('/teams/:id/members', authenticateToken, requireUserOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const rawMembers = Array.isArray(req.body.members) ? req.body.members : [];

    const normalizedMembers = rawMembers.map((member: any) => {
      if (typeof member === 'string') {
        return { name: member.trim(), isVik: false, isBme: false, isFemale: false };
      }
      return {
        name: String(member?.name || '').trim(),
        isVik: Boolean(member?.isVik),
        isBme: Boolean(member?.isBme),
        isFemale: Boolean(member?.isFemale),
      };
    }).filter((m: any) => m.name.length > 0);

    if (isNaN(id) || normalizedMembers.length === 0) {
      return res.status(400).json({ error: 'Érvényes csapat és legalább egy név szükséges' });
    }

    const team = await prisma.cupTeam.findUnique({ where: { id } });
    if (!team) return res.status(404).json({ error: 'A csapat nem található' });
    if (req.user!.role !== 'ADMIN' && team.captainUserId !== req.user!.id) {
      return res.status(403).json({ error: 'A csapatnévsort csak a csapatkapitány módosíthatja' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cupTeamMember.deleteMany({ where: { teamId: id } });
      return tx.cupTeam.update({
        where: { id },
        data: {
          memberCount: normalizedMembers.length,
          members: { create: normalizedMembers },
        },
        include: { members: true },
      });
    });
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Csapatnévsor módosítási hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a csapatnévsor módosítása során' });
  }
});

// GET /api/cup/results - Korábbi kupa eredmények lekérése (nyilvános, kizárólag Vegyes)
router.get('/results', async (req: Request, res: Response) => {
  try {
    const { year, cupEdition } = req.query;

    const whereClause: any = { category: 'VEGYES' };
    if (year) {
      const parsedYear = parseInt(year as string, 10);
      if (!isNaN(parsedYear)) whereClause.year = parsedYear;
    }
    if (cupEdition && typeof cupEdition === 'string') {
      whereClause.cupEdition = cupEdition;
    }

    const results = await prisma.cupResult.findMany({
      where: whereClause,
      orderBy: [{ year: 'desc' }, { placement: 'asc' }],
    });

    return res.status(200).json(results);
  } catch (error) {
    console.error('Kupa eredmények lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a kupa eredmények lekérése során' });
  }
});

// POST /api/cup/results - Kupa eredmény rögzítése (csak ADMIN)
router.post('/results', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { cupEdition, year, category, placement, teamName, notes } = req.body;

    if (!cupEdition || typeof cupEdition !== 'string' || !cupEdition.trim()) {
      return res.status(400).json({ error: 'A kupa forduló (cupEdition) megadása kötelező' });
    }
    if (year === undefined || !Number.isInteger(Number(year))) {
      return res.status(400).json({ error: 'Érvényes évszám (year) megadása kötelező' });
    }
    if (placement === undefined || !Number.isInteger(Number(placement)) || Number(placement) <= 0) {
      return res.status(400).json({ error: 'Érvényes helyezés (placement, pozitív egész) megadása kötelező' });
    }
    if (!teamName || typeof teamName !== 'string' || !teamName.trim()) {
      return res.status(400).json({ error: 'A csapatnév (teamName) megadása kötelező' });
    }

    const result = await prisma.cupResult.create({
      data: {
        cupEdition: cupEdition.trim(),
        year: Number(year),
        category: (category || 'VEGYES').trim(),
        placement: Number(placement),
        teamName: teamName.trim(),
        notes: notes ? String(notes).trim() : null,
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CUP_RESULT_CREATE',
      details: `Kupa eredmény rögzítve: ${result.cupEdition} - ${result.placement}. hely: ${result.teamName}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Kupa eredmény sikeresen rögzítve!',
      result,
    });
  } catch (error) {
    console.error('Kupa eredmény mentési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a kupa eredmény mentése során' });
  }
});

// GET /api/cup/schedule - Aktuális torna lebonyolítás táblázat metaadatai
router.get('/schedule', async (_req: Request, res: Response) => {
  try {
    const schedule = await prisma.cupSchedule.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!schedule) {
      return res.status(200).json({
        hasSchedule: false,
        fileName: null,
        updatedAt: null,
      });
    }

    return res.status(200).json({
      hasSchedule: true,
      fileName: schedule.fileName,
      mimeType: schedule.mimeType,
      updatedAt: schedule.updatedAt,
    });
  } catch (error) {
    console.error('Lebonyolítási táblázat lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a lebonyolítás lekérése során' });
  }
});

// GET /api/cup/schedule/download - Aktuális torna lebonyolítás táblázat letöltése
router.get('/schedule/download', async (_req: Request, res: Response) => {
  try {
    const schedule = await prisma.cupSchedule.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Jelenleg nem elérhető a kupa lebonyolítása' });
    }

    const fileBuffer = Buffer.from(schedule.fileData, 'base64');
    res.setHeader('Content-Type', schedule.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(schedule.fileName)}"`);
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Lebonyolítási fájl letöltési hiba:', error);
    return res.status(500).json({ error: 'Hiba a lebonyolítási fájl letöltésekor' });
  }
});

// POST /api/cup/schedule - Új torna lebonyolítás táblázat feltöltése (ADMIN)
router.post('/schedule', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, mimeType } = req.body;

    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      return res.status(400).json({ error: 'A fájlnév megadása kötelező' });
    }
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'A fájl tartalom (base64) megadása kötelező' });
    }
    if (!/\.xlsx$/i.test(fileName.trim())) {
      return res.status(400).json({ error: 'A lebonyolítási fájl formátuma csak .xlsx lehet' });
    }

    // Replace previous schedules
    await prisma.cupSchedule.deleteMany();

    const created = await prisma.cupSchedule.create({
      data: {
        fileName: fileName.trim(),
        fileData,
        mimeType: mimeType || 'application/octet-stream',
      },
    });

    await createAuditLog({
      userId: req.user!.id,
      action: 'CUP_SCHEDULE_UPLOAD',
      details: `Kupa lebonyolítás táblázat feltöltve: "${created.fileName}"`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Lebonyolítás táblázat sikeresen feltöltve!',
      schedule: {
        hasSchedule: true,
        fileName: created.fileName,
        updatedAt: created.updatedAt,
      },
    });
  } catch (error) {
    console.error('Lebonyolítás táblázat feltöltési hiba:', error);
    return res.status(500).json({ error: 'Hiba a lebonyolítás táblázat mentésekor' });
  }
});

// DELETE /api/cup/schedule - Torna lebonyolítás táblázat törlése (ADMIN)
router.delete('/schedule', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.cupSchedule.deleteMany();

    await createAuditLog({
      userId: req.user!.id,
      action: 'CUP_SCHEDULE_DELETE',
      details: 'Kupa lebonyolítás táblázat törölve',
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(200).json({
      message: 'Lebonyolítás táblázat sikeresen törölve.',
      hasSchedule: false,
    });
  } catch (error) {
    console.error('Lebonyolítás táblázat törlési hiba:', error);
    return res.status(500).json({ error: 'Hiba a táblázat törlésekor' });
  }
});

export default router;
