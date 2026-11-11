# AGENTS.md — MI-ügynök útmutató a RopiWeb projekthez

Ez a fájl az MI-kódolóügynököknek (Kiro, GitHub Copilot, Claude Code, Codex stb.)
szól. Célja, hogy az ügynök a projekt tényleges konvencióit kövesse, és ne
vezessen be idegen mintákat. Ember számára is olvasható áttekintés.

## A projekt dióhéjban

BME VIK Röplabda Kör webalkalmazása. Két külön npm projekt:

- `backend/` — Express + Prisma (SQLite) REST API, TypeScript.
- `frontend/` — Next.js (App Router) + Tailwind, TypeScript.

A fő üzleti logika a backendben van (`backend/src/routes/`,
`backend/src/middleware/`). A frontend a `/api` hívásokat a backend felé
proxyzza.

## Fontos parancsok (mindig a megfelelő mappából)

### Backend (`cd backend`)

```bash
npm run dev              # fejlesztői szerver (tsx watch)
npm run build            # TypeScript fordítás -> dist/
npm test                 # Vitest tesztek egyszeri futtatása
npm run test:watch       # Vitest figyelő módban
npm run prisma:push      # séma alkalmazása az adatbázisra
npm run prisma:seed      # tesztadatok betöltése (TÖRLI a meglévőt)
```

### Frontend (`cd frontend`)

```bash
npm run dev
npm run build
npm run lint
```

## Konvenciók, amelyeket az ügynöknek követnie kell

1. **Nyelv.** A felhasználónak látható szövegek, hibaüzenetek és a
   kód-kommentek magyarul íródnak. A változó- és függvénynevek angolul.
2. **Validáció a middleware-ben.** A bemenet-ellenőrzés a
   `backend/src/middleware/validate.ts`-ben történik, nem a route törzsében.
   Új szabályt is ide tegyél.
3. **Jogosultság.** Védett végpontokhoz `authenticateToken`, majd
   `requireAdmin` vagy `requireUserOrAdmin` (lásd `middleware/auth.ts`).
   Jogosulatlan hozzáférés -> HTTP 403 + `UNAUTHORIZED_ACCESS` audit bejegyzés.
4. **HTTP státuszkódok.** Validációs hiba 400, auth hiány 401, tiltott
   művelet 403, nem található 404, duplikáció/ütközés 409, siker 200/201.
5. **Audit napló.** Minden érdemi írási művelet után
   `createAuditLog({...})` (lásd `lib/audit.ts`).
6. **Adatbázis.** Prisma kliens a `backend/src/lib/prisma.ts`-ből. A séma
   módosítása után `npm run prisma:push`. Sorrend-/létszámfüggő műveletek
   `prisma.$transaction`-ben fussanak (lásd `routes/registrations.ts`).

## Tesztelési elvárások az ügynök felé

- A tesztek **Vitest + Supertest** alapúak, a `backend/tests/` mappában.
- A tesztek **külön adatbázist** használnak (`backend/prisma/test.db`), amit a
  `tests/global-setup.ts` minden futás elején nulláról épít fel. Soha ne a
  `dev.db`-re írj tesztet.
- Üzleti szabály bevezetése vagy módosítása után **futtatható tesztet** kell
  írni/aktualizálni, és le kell futtatni (`npm test`).
- A tesztek sorosan futnak (`fileParallelism: false`), mert közös az adatbázis.
- A kötelezően lefedett szabályok és az elfogadási feltételek → tesztek
  megfeleltetése a `docs/TESZTELES.md` fájlban van.

## MI-használat dokumentálása

A fejlesztés során hozott érdemi döntéseket és azok ellenőrzését a
`docs/MI_HASZNALAT.md` dokumentálja. Ha az ügynök érdemi tervezési/implementációs
döntést hoz, a döntés indoklását és az ellenőrzés bizonyítékát (teszt vagy
futtatási eredmény) ott kell rögzíteni.

## Amit az ügynök NE tegyen

- Ne írja felül a `backend/.env` fájlt és ne szivárogtassa ki a `JWT_SECRET`-et.
- Ne futtasson `prisma:seed`-et ellenőrzés nélkül: törli a meglévő adatokat.
- Ne vezessen be új HTTP kliens/validációs/ORM könyvtárat a meglévők helyett.
- Ne kommitáljon a `main`/`master` ágra külön kérés nélkül.
