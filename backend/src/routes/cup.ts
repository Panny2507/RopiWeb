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
    const { teamName, captainName, captainEmail, memberCount, category, cupEdition, acceptedRules } = req.body;

    const team = await prisma.cupTeam.create({
      data: {
        teamName: teamName.trim(),
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim().toLowerCase(),
        memberCount: Number(memberCount),
        category: category.trim(),
        cupEdition: cupEdition.trim(),
        acceptedRules: Boolean(acceptedRules),
        status: 'SUBMITTED',
      },
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

// GET /api/cup/results - Korábbi kupa eredmények lekérése (nyilvános)
router.get('/results', async (req: Request, res: Response) => {
  try {
    const { year, cupEdition } = req.query;

    const whereClause: any = {};
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
      return res.status(400).json({ error: 'A kupa kiírás (cupEdition) megadása kötelező' });
    }
    if (year === undefined || !Number.isInteger(Number(year))) {
      return res.status(400).json({ error: 'Érvényes évszám (year) megadása kötelező' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'A kategória (category) megadása kötelező' });
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
        category: category.trim(),
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

export default router;
