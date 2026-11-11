/**
 * Minden tesztfájl előtt lefutó beállítás.
 *
 * A környezeti változókat MÉG azelőtt állítjuk be, hogy bármelyik modul
 * (pl. a Prisma kliens vagy az Express app) betöltődne. Ezért van ez a fájl a
 * vitest `setupFiles` listájában, és ezért nem importálunk itt app-kódot.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-jwt-secret-ropiweb';
process.env.CORS_ORIGIN = 'http://localhost:3000';
