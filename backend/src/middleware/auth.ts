import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit';

const JWT_SECRET = process.env.JWT_SECRET || 'ropiweb-super-secret-jwt-key-2026';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(payload: AuthUser): string {
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

  if (!token) {
    return res.status(401).json({ error: 'Bejelentkezés szükséges (hiányzó token)' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'A felhasználó nem található' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Érvénytelen vagy lejárt token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Bejelentkezés szükséges' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // EF-5: non-admin users calling admin endpoints -> HTTP 403 + audit log entry
      const rawIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        null;

      await createAuditLog({
        userId: req.user.id,
        action: 'UNAUTHORIZED_ACCESS',
        details: `Jogosulatlan hozzáférési kísérlet: ${req.method} ${req.originalUrl}. Felhasználói szerepkör: ${req.user.role}, elvárt: ${allowedRoles.join(', ')}`,
        ipAddress: rawIp,
      });

      return res.status(403).json({
        error: 'Nincs jogosultságod a művelet végrehajtásához (ADMIN jogosultság szükséges)',
      });
    }

    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireUserOrAdmin = requireRole('USER', 'ADMIN');
