import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, createUser, tokenFor } from './helpers';

/**
 * Edzés létrehozás (EF-3) tesztek.
 *
 * Szabály: edzést csak ADMIN hozhat létre, minden kötelező mezővel, és a
 * dátumnak a JÖVŐBEN kell lennie (különben HTTP 400).
 *
 * Lefedett esetek:
 *  - Normál: érvényes jövőbeli edzés létrehozása ADMIN által -> 201
 *  - Hibás bemenet: múltbeli dátum -> 400
 *  - Hibás bemenet: hiányzó kötelező mező -> 400
 *  - Jogosulatlan: USER szerepkör edzést próbál létrehozni -> 403 (EF-5)
 */

function futureTraining(overrides: Record<string, unknown> = {}) {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);
  return {
    title: 'Keddi edzés',
    location: 'BME',
    address: '1111 Budapest, Bertalan Lajos u. 4-6.',
    date: future.toISOString(),
    startTime: '18:00',
    endTime: '20:00',
    maxParticipants: 20,
    type: 'GYAKORLÁS',
    ...overrides,
  };
}

describe('POST /api/trainings (EF-3 edzés létrehozás)', () => {
  let admin: Awaited<ReturnType<typeof createUser>>;
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createUser({ email: 'admin@test.hu', name: 'Admin', role: 'ADMIN' });
    user = await createUser({ email: 'user@test.hu', name: 'User', role: 'USER' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- NORMÁL ESET ---
  it('ADMIN érvényes jövőbeli edzést hoz létre (201)', async () => {
    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send(futureTraining());

    expect(res.status).toBe(201);
    expect(res.body.training.title).toBe('Keddi edzés');
  });

  // --- HIBÁS BEMENET: múltbeli dátum ---
  it('múltbeli dátummal 400 (a dátumnak a jövőben kell lennie)', async () => {
    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);

    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send(futureTraining({ date: past.toISOString() }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jövőben/i);
  });

  // --- HIBÁS BEMENET: hiányzó mező ---
  it('hiányzó kötelező mező (title) esetén 400', async () => {
    const body = futureTraining();
    delete (body as Record<string, unknown>).title;

    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  // --- JOGOSULATLAN MŰVELET (EF-5) ---
  it('USER szerepkörrel az edzés létrehozása tiltott (403)', async () => {
    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send(futureTraining());

    expect(res.status).toBe(403);
  });
});
