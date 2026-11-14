import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // A tesztek Node környezetben futnak (Express + Prisma), nem böngészőben.
    environment: 'node',
    // A globalSetup egyszer fut a teljes futás elején: előkészíti a teszt-adatbázist.
    globalSetup: ['./tests/global-setup.ts'],
    // Közös beállítás minden tesztfájl elé (env változók stb.).
    setupFiles: ['./tests/setup.ts'],
    // A tesztek az adatbázist közösen használják, ezért egyetlen worker-ben,
    // sorosan futnak, hogy ne lépjenek egymás adataiba.
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
