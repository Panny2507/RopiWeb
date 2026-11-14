import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/prisma';
import { generateToken } from '../src/middleware/auth';

/**
 * Teszt segédfüggvények: adatbázis tisztítása, felhasználók/edzések létrehozása,
 * JWT tokenek generálása. Ezek teszik ismételhetővé és olvashatóvá a teszteket.
 */

/** Minden tábla kiürítése a függőségi sorrendet tiszteletben tartva. */
export async function resetDatabase() {
  await prisma.auditLog.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.training.deleteMany();
  await prisma.cupTeamMember.deleteMany();
  await prisma.cupTeam.deleteMany();
  await prisma.cupResult.deleteMany();
  await prisma.cupSchedule.deleteMany();
  await prisma.cupRules.deleteMany();
  await prisma.message.deleteMany();
  await prisma.user.deleteMany();
}

interface CreateUserOptions {
  email: string;
  name: string;
  role?: 'USER' | 'ADMIN' | 'GUEST';
  password?: string;
}

/** Felhasználó létrehozása hasítolt jelszóval. */
export async function createUser(opts: CreateUserOptions) {
  const password = opts.password ?? 'password123';
  return prisma.user.create({
    data: {
      email: opts.email.toLowerCase(),
      password: await bcrypt.hash(password, 10),
      name: opts.name,
      role: opts.role ?? 'USER',
      isActiveMember: true,
    },
  });
}

/** Érvényes Bearer token előállítása egy felhasználóhoz. */
export function tokenFor(user: { id: number; email: string; role: string; name: string }) {
  return generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
}

/** Egy jövőbeli edzés létrehozása, konfigurálható maximális létszámmal. */
export async function createTraining(createdBy: number, maxParticipants = 20) {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  return prisma.training.create({
    data: {
      title: 'Teszt edzés',
      location: 'BME',
      address: '1111 Budapest',
      date: futureDate,
      startTime: '18:00',
      endTime: '20:00',
      maxParticipants,
      type: 'GYAKORLÁS',
      createdBy,
    },
  });
}
