import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken, authenticateToken } from '../middleware/auth';
import { isValidEmail } from '../middleware/validate';
import { createAuditLog } from '../lib/audit';

const router = Router();

// POST /api/auth/register - Felhasználó regisztráció
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, position, isActiveMember } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'A név megadása kötelező' });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Érvényes email cím megadása kötelező' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Ez az email cím már regisztrálva van' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
        role: 'USER',
        neptunCode: null,
        position: position ? String(position).trim() : null,
        isActiveMember: Boolean(isActiveMember),
      },
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

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTER',
      details: `Új felhasználó regisztrált: ${user.name} (${user.email})`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    return res.status(201).json({
      message: 'Sikeres regisztráció!',
      token,
      user,
    });
  } catch (error) {
    console.error('Regisztrációs hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a regisztráció során' });
  }
});

// POST /api/auth/login - Bejelentkezés
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Az email és jelszó megadása kötelező' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(401).json({ error: 'Hibás email cím vagy jelszó' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Hibás email cím vagy jelszó' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      details: `Sikeres bejelentkezés: ${user.email}`,
      ipAddress: req.ip || req.socket.remoteAddress || null,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      neptunCode: user.neptunCode,
      isActiveMember: user.isActiveMember,
      position: user.position,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: 'Sikeres bejelentkezés!',
      token,
      user: userProfile,
    });
  } catch (error) {
    console.error('Bejelentkezési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a bejelentkezés során' });
  }
});

// GET /api/auth/me - Aktuális felhasználói adatok
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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

    if (!user) {
      return res.status(404).json({ error: 'A felhasználó nem található' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Felhasználó lekérési hiba:', error);
    return res.status(500).json({ error: 'Hiba történt a felhasználói adatok lekérésekor' });
  }
});

export default router;
