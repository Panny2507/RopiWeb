import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Globális teszt-előkészítés.
 *
 * Fontos: a tesztek NEM a fejlesztői adatbázist (dev.db) használják, hanem egy
 * külön, eldobható SQLite fájlt (test.db). Így a tesztek futtatása soha nem
 * írja felül a fejlesztői/seedelt adatokat, és minden futás tiszta sémával indul.
 */
export default async function setup() {
  const testDbPath = resolve(__dirname, '../prisma/test.db');
  const testDbUrl = 'file:./test.db';

  // Tiszta induló állapot: a korábbi teszt-adatbázist töröljük.
  for (const suffix of ['', '-journal']) {
    const p = testDbPath + suffix;
    if (existsSync(p)) rmSync(p);
  }

  // A Prisma sémát a teszt-adatbázisra alkalmazzuk (táblák létrehozása).
  execSync('npx prisma db push --skip-generate', {
    cwd: resolve(__dirname, '..'),
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });
}
