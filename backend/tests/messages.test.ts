import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, createUser, tokenFor } from './helpers';

/**
 * "Üzenj nekünk" modul tesztek (EF-8).
 *
 * Szabály (EF-8, NORMÁL): a nyilvános üzenetküldés (auth nélkül) elmenti az
 * üzenetet az adatbázisba, és az ADMIN listázó nézetben megjelenik.
 * Kiegészítő hibás bemenet: érvénytelen email -> 400.
 */
describe('POST /api/messages (EF-8 üzenetküldés)', () => {
  let admin: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createUser({ email: 'admin@test.hu', name: 'Admin', role: 'ADMIN' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // --- EF-8 NORMÁL ESET ---
  it('nyilvános üzenet mentésre kerül és az admin listában megjelenik (201)', async () => {
    const res = await request(app).post('/api/messages').send({
      senderName: 'Látogató Lili',
      senderEmail: 'lili@example.com',
      subject: 'Csatlakozás',
      body: 'Szeretnék csatlakozni az edzésekhez!',
    });

    expect(res.status).toBe(201);

    // Adatbázisban is ott van
    const stored = await prisma.message.findFirst({ where: { subject: 'Csatlakozás' } });
    expect(stored).not.toBeNull();
    expect(stored?.isRead).toBe(false);

    // ADMIN listázó nézetben megjelenik
    const list = await request(app)
      .get('/api/messages')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(list.status).toBe(200);
    expect(list.body.some((m: any) => m.subject === 'Csatlakozás')).toBe(true);
  });

  // --- HIBÁS BEMENET: érvénytelen email ---
  it('érvénytelen email cím esetén 400', async () => {
    const res = await request(app).post('/api/messages').send({
      senderName: 'Hibás Küldő',
      senderEmail: 'nem-email',
      subject: 'Tárgy',
      body: 'Szöveg',
    });

    expect(res.status).toBe(400);
  });
});
