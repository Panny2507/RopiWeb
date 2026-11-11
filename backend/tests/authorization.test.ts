import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/lib/prisma';
import { resetDatabase, createUser, tokenFor } from './helpers';

/**
 * Jogosultság (EF-5) tesztek.
 *
 * Szabály: az admin végpontokat csak ADMIN szerepkör érheti el. Jogosulatlan
 * hozzáféréskor HTTP 403, és a rendszer AuditLog bejegyzést készít
 * UNAUTHORIZED_ACCESS akcióval.
 *
 * Lefedett esetek:
 *  - Jogosulatlan: USER token -> 403 az admin végponton
 *  - Hibás bemenet: hiányzó token -> 401
 *  - Ellenőrzés: a 403 mellett AuditLog UNAUTHORIZED_ACCESS bejegyzés keletkezik
 *  - Normál: ADMIN token -> 200
 */
describe('EF-5 jogosultság-ellenőrzés az admin végpontokon', () => {
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

  it('USER szerepkör az admin felhasználólistát 403-mal kapja', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(user)}`);

    expect(res.status).toBe(403);
  });

  it('token nélkül 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('a jogosulatlan hozzáférés UNAUTHORIZED_ACCESS audit bejegyzést készít', async () => {
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(user)}`);

    const log = await prisma.auditLog.findFirst({
      where: { action: 'UNAUTHORIZED_ACCESS', userId: user.id },
    });
    expect(log).not.toBeNull();
    expect(log?.details).toContain('USER');
  });

  it('ADMIN szerepkör eléri az admin felhasználólistát (200)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
