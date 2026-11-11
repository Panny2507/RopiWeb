import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import {
  resetDatabase,
  createUser,
  tokenFor,
  createTraining,
} from './helpers';

/**
 * Edzés-jelentkezés tesztek.
 *
 * Lefedett elfogadási feltételek / szabályok:
 *  - Normál eset: jelentkezés szabad helyre -> ACCEPTED (HTTP 201)
 *  - Határeset 1: az utolsó szabad hely még ACCEPTED, a következő már WAITLISTED
 *  - Határeset 2: ACCEPTED résztvevő lemondása -> az első várólistás automatikus
 *    előreléptetése ACCEPTED-re (FIFO a position mező szerint)
 *  - Hibás/jogosulatlan: token nélküli jelentkezés -> HTTP 401;
 *    duplikált jelentkezés -> HTTP 409 (EF-4)
 *  - Regresszió: a lemondás utáni előreléptetés a legkisebb position-t léptesse elő
 *    (a FIFO sorrend ne sérüljön) -- ez a hibás változaton elbukó teszt.
 */
describe('POST /api/registrations (edzés-jelentkezés)', () => {
  let admin: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createUser({ email: 'admin@test.hu', name: 'Admin', role: 'ADMIN' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- NORMÁL ESET ---
  it('szabad helyre jelentkezve ACCEPTED státuszt ad (201)', async () => {
    const user = await createUser({ email: 'u1@test.hu', name: 'User 1' });
    const training = await createTraining(admin.id, 20);

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ trainingId: training.id });

    expect(res.status).toBe(201);
    expect(res.body.registration.status).toBe('ACCEPTED');
    expect(res.body.registration.position).toBe(1);
  });

  // --- HATÁRESET 1: pontosan betelő létszám ---
  it('az utolsó szabad hely ACCEPTED, a következő jelentkező WAITLISTED', async () => {
    const training = await createTraining(admin.id, 1); // csak 1 hely
    const first = await createUser({ email: 'first@test.hu', name: 'Első' });
    const second = await createUser({ email: 'second@test.hu', name: 'Második' });

    const resFirst = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(first)}`)
      .send({ trainingId: training.id });

    const resSecond = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(second)}`)
      .send({ trainingId: training.id });

    expect(resFirst.body.registration.status).toBe('ACCEPTED');
    expect(resSecond.status).toBe(201);
    expect(resSecond.body.registration.status).toBe('WAITLISTED');
  });

  // --- HIBÁS BEMENET / JOGOSULATLAN MŰVELET ---
  it('token nélkül a jelentkezés elutasított (401)', async () => {
    const training = await createTraining(admin.id, 20);
    const res = await request(app)
      .post('/api/registrations')
      .send({ trainingId: training.id });

    expect(res.status).toBe(401);
  });

  it('nem létező edzésre jelentkezve 404', async () => {
    const user = await createUser({ email: 'u@test.hu', name: 'User' });
    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(user)}`)
      .send({ trainingId: 999999 });

    expect(res.status).toBe(404);
  });

  // --- EF-4: DUPLIKÁCIÓ -> 409 ---
  it('ugyanarra az edzésre kétszer jelentkezve 409 Conflict (EF-4)', async () => {
    const user = await createUser({ email: 'dup@test.hu', name: 'Dup' });
    const training = await createTraining(admin.id, 20);
    const token = tokenFor(user);

    const first = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ trainingId: training.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({ trainingId: training.id });
    expect(second.status).toBe(409);
  });
});

describe('DELETE /api/registrations/:trainingId (lemondás + előreléptetés)', () => {
  let admin: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createUser({ email: 'admin@test.hu', name: 'Admin', role: 'ADMIN' });
  });

  // --- HATÁRESET 2 + REGRESSZIÓ ---
  // Ez a teszt bizonyítja, hogy ACCEPTED lemondásakor a FIFO sorrendben
  // LEGKORÁBBAN jelentkezett várólistás lép elő. Ez az a teszt, amely a
  // szándékosan hibás változaton (legkésőbbi várólistást léptet elő) elbukik.
  it('ACCEPTED lemondásakor a legkorábbi várólistás lép elő (FIFO regresszió)', async () => {
    const training = await createTraining(admin.id, 1); // 1 férőhely

    const accepted = await createUser({ email: 'acc@test.hu', name: 'Elfogadott' });
    const wait1 = await createUser({ email: 'w1@test.hu', name: 'Várólista 1' });
    const wait2 = await createUser({ email: 'w2@test.hu', name: 'Várólista 2' });

    // Sorrendben jelentkeznek: accepted (ACCEPTED), wait1 (WAITLISTED), wait2 (WAITLISTED)
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(accepted)}`)
      .send({ trainingId: training.id });
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(wait1)}`)
      .send({ trainingId: training.id });
    await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${tokenFor(wait2)}`)
      .send({ trainingId: training.id });

    // Az elfogadott résztvevő lemondja a jelentkezését
    const del = await request(app)
      .delete(`/api/registrations/${training.id}`)
      .set('Authorization', `Bearer ${tokenFor(accepted)}`);

    expect(del.status).toBe(200);
    // A LEGKORÁBBAN jelentkezett várólistásnak (wait1) kell előrelépnie
    expect(del.body.promotedUser?.email).toBe('w1@test.hu');

    // Ellenőrizzük az adatbázis végállapotát is
    const wait1Reg = await prisma.registration.findFirst({
      where: { trainingId: training.id, userId: wait1.id },
    });
    const wait2Reg = await prisma.registration.findFirst({
      where: { trainingId: training.id, userId: wait2.id },
    });
    expect(wait1Reg?.status).toBe('ACCEPTED');
    expect(wait2Reg?.status).toBe('WAITLISTED');
  });

  it('nem létező jelentkezés lemondása 404', async () => {
    const user = await createUser({ email: 'nope@test.hu', name: 'Senki' });
    const training = await createTraining(admin.id, 20);
    const res = await request(app)
      .delete(`/api/registrations/${training.id}`)
      .set('Authorization', `Bearer ${tokenFor(user)}`);
    expect(res.status).toBe(404);
  });
});
