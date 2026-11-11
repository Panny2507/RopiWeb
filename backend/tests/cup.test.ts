import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, createUser, tokenFor } from './helpers';

/**
 * Röpikupa csapatnevezés tesztek (EF-6).
 *
 * Szabály (EF-6, NORMÁL): érvényes adatokkal nevezett csapat a DB-be kerül,
 * SUBMITTED státusszal, és megjelenik a nevezett csapatok listájában.
 * Kiegészítő hibás/jogosulatlan esetek: elfogadott szabályzat nélkül 400,
 * token nélkül 401.
 */

function validTeam(overrides: Record<string, unknown> = {}) {
  return {
    teamName: 'Villany Ászok',
    captainName: 'Teszt Kapitány',
    captainEmail: 'kapitany@test.hu',
    cupEdition: 'IV. VRK 2026',
    category: 'Casual',
    acceptedRules: true,
    members: [
      { name: 'Játékos 1', isVik: true, isBme: true, isFemale: false },
      { name: 'Játékos 2', isVik: false, isBme: true, isFemale: true },
    ],
    ...overrides,
  };
}

describe('POST /api/cup/teams (EF-6 kupanevezés)', () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser({ email: 'user@test.hu', name: 'User', role: 'USER' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- EF-6 NORMÁL ESET ---
  it('érvényes csapatot ment SUBMITTED státusszal és listázza (201)', async () => {
    const res = await request(app)
      .post('/api/cup/teams')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send(validTeam());

    expect(res.status).toBe(201);
    expect(res.body.team.status).toBe('SUBMITTED');
    expect(res.body.team.memberCount).toBe(2);

    // Megjelenik a nyilvános listában
    const list = await request(app).get('/api/cup/teams');
    expect(list.status).toBe(200);
    expect(list.body.some((t: any) => t.teamName === 'Villany Ászok')).toBe(true);
  });

  // --- HIBÁS BEMENET: szabályzat elfogadása nélkül ---
  it('a versenyszabályzat elfogadása nélkül 400', async () => {
    const res = await request(app)
      .post('/api/cup/teams')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send(validTeam({ acceptedRules: false }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/szabályzat/i);
  });

  // --- JOGOSULATLAN: token nélkül ---
  it('token nélkül a nevezés elutasított (401)', async () => {
    const res = await request(app).post('/api/cup/teams').send(validTeam());
    expect(res.status).toBe(401);
  });
});
