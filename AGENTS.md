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

---

## MI-használat és döntések — három dokumentált eset

Ez a szakasz a projekt teljes fejlesztési folyamatában igazolt MI-asszisztált
döntési eseteket foglalja össze. A részletes kifejtés és a bizonyítékok hivatkozása
a `docs/MI_HASZNALAT.md` fájlban találhatók.

**Felhasznált MI-eszköz:** Google Antigravity (AGY) — agentic coding assistant
(Claude Opus 4.6, Gemini Flash modellek; párhuzamos subagent-architektúra),
valamint **Kiro** — tesztkörnyezet, tesztek, regressziós bizonyíték.

**AI-támogató elemek a kódbázisban:**
- [`AGENTS.md`](./AGENTS.md) — ügynök-útmutató (parancsok, konvenciók,
  tesztelési és jogosultsági szabályok, tiltások).
- [`docs/MI_HASZNALAT.md`](./docs/MI_HASZNALAT.md) — döntési esetek
  részletes dokumentációja.
- [`docs/TESZTELES.md`](./docs/TESZTELES.md) — elfogadási feltételek → tesztek
  megfeleltetési táblázat.

---

### 1. döntési eset — Architektúra és teljes kódbázis generálása (implementáció fázis)

**Probléma.** A projektet nulláról kellett felépíteni: külön backend
(Express + Prisma + SQLite) és frontend (Next.js + Tailwind) réteggel, JWT-alapú
autentikációval, szerepkör-kezeléssel és seed adatokkal.

**Eszköz.** Google Antigravity (AGY) — Claude Opus 4.6, agentic mód,
párhuzamos subagent-architektúra (backend-builder + frontend-builder egyszerre).

**Átadott kontextus és utasítás.** A PDF specifikációból kinyert teljes
követelménylista (EF-1–EF-8), az adatmodell (User, Training, Registration,
CupTeam, CupResult, Message, AuditLog), az összes API-végpont,
az elfogadási feltételek, és a konkrét seed adatok (5 felhasználó, 6 edzés,
3 kupa csapat, 12 eredmény, 2 üzenet). Explicit utasítás: `bcryptjs`-t
használjon (ne `bcrypt`), hogy Windows-on natív fordítás nélkül fusson.

**A javaslat lényege.** Az MI két párhuzamos subagent-et indított: az egyik
a teljes backended (15 fájl: routes, middleware, lib, seed), a másik a teljes
frontendet (23 fájl: App Router oldalak, komponensek, context, típusok) generálta.
A backend `prisma.$transaction`-t javasolt a létszám + státusz atomikus
kezeléséhez; a frontend `AuthContext`-et a JWT tárolásához.

**Saját döntés és indok.** A tranzakciós megközelítést és a subagent-párhuzamot
**elfogadtam**: a versenyhelyzet-mentes létszámkezelés valódi követelmény, és a
párhuzamos build lényegesen gyorsabb, mint a szekvenciális. Az `bcryptjs`
javaslatot szintén elfogadtam — a natív `bcrypt` Windows-on fordítási hibát
okoz, ez ismert probléma.

**Ellenőrzés (bizonyíték).** Mindkét subagent sikeres `npm install`,
`prisma db push` és `prisma:seed` futást jelentett vissza. A backend
`src/routes/registrations.ts` tartalmazza a `prisma.$transaction` blokkot az
EF-1/EF-2 logikával; az EF-4 HTTP 409 válasz (`'Már regisztráltál erre az
edzésre'`) szintén ott van.
Hivatkozás: [`backend/src/routes/registrations.ts`](./backend/src/routes/registrations.ts)

---

### 2. döntési eset — UI finomítás és helyszínszűrők átdolgozása (UI-iteráció fázis)

**Probléma.** Az alap generálás után a frontend szövegei, szűrői és
adatstruktúrái nem tükrözték a valóságos köri helyszíneket és elnevezéseket
(pl. a „BME" szűrő nem foglalta magában a Bercsényi, Kármán, Sportközpont
helyszíneket; a Röpikupa oldalon „kiadás" helyett „forduló" kellett; a
vezető-oldal felirata is pontosítást igényelt).

**Eszköz.** Google Antigravity (AGY) — Gemini 3.8 Flash (High), önálló
chat-munkamenet (conversation ID: f97ed087).

**Átadott kontextus és utasítás.** A meglévő frontend forrásfájlok
(edzes/page.tsx, ropikupa/page.tsx, page.tsx, uzenet/page.tsx, admin/page.tsx
stb.) és egy részletes, pontról-pontra haladó módosítási lista: szűrő-logika
(BME ⊃ strand, bercsényi, kármán, sportközpont, sporttelep; Óbudai = Doberdói
Kolégium), alapértelmezett max. létszám (20), vizuális azonosítók (különböző
keretszínek helyszínenként), szöveges korrekciók és Q&A-szekció.

**A javaslat lényege.** Az MI minden módosítást egységes diff-sorozatként
alkalmazott: átírta a szűrők feltétellogikáját `includes()` stringmatch alapra,
beemelte a helyszínenként eltérő Tailwind keretszíneket, átnevezte a feliratokat,
hozzáadta a Q&A blokkot, és eltávolította a felesleges jelvényeket (badge-eket)
az edzéskártyákról.

**Saját döntés és indok.** A javaslatot **teljes egészében elfogadtam**: az
`includes()`-alapú szűrőlogika rugalmas és tömör — nem kell az összes lehetséges
helyszínnevet előre felsorolni, az ékezetes/ékezet nélküli formák kezelése
automatikus (mindkettőt beleírva), és az olvashatósága is jobb, mint egy
explicit whitelist. Ha a jövőben új helyszín kerül az adatbázisba, csak a
kulcsszót kell felvenni a `includes()` ágba, nem kell enum-listát karbantartani.

**Ellenőrzés (bizonyíték).** A módosítás lefutott, az edzésszűrő az `includes()`
logika szerint működik. Az ékezetes és ékezet nélküli formák (`bercsényi` /
`bercsenyi`) mindkét esetben eltalálják a megfelelő edzéseket.
Hivatkozás: [`frontend/src/app/edzes/page.tsx`](./frontend/src/app/edzes/page.tsx)
(szűrőlogika: 44–80. sor)

---

### 3. döntési eset — JWT tárolási stratégia: localStorage vs. httpOnly cookie (autentikáció-architektúra fázis)

**Probléma.** A JWT tokent valahol el kell tárolni a böngészőben. Két elterjedt
megközelítés létezik: `localStorage` (egyszerű, de XSS-nek kitett) vs. `httpOnly
cookie` (XSS-biztos, de CSRF-et igényel kezelni). Dönteni kellett, melyik illik
egy belső, campus-közösségi alkalmazáshoz.

**Eszköz.** Google Antigravity (AGY) — Claude Opus 4.6, az architektúra-generálás
fázisában (conversation ID: 66f17a71).

**Átadott kontextus és utasítás.** A projekt specifikációja (belső köri webapp,
nem banki/érzékeny adat), a Next.js App Router architektúra, az `AuthContext`
tervezett működése. Utasítás: javasolt megközelítés az állapotkezeléshez és a
token perzisztenciához.

**A javaslat lényege.** Az MI a `localStorage`-alapú tárolást javasolta:
a JWT-t bejelentkezéskor eltároljuk, az `AuthContext` indulásakor kiolvasunk,
és minden API-kérésnél `Authorization: Bearer <token>` fejlécként küldjük.
Ez szimmetrikus a backend `authenticateToken` middleware-rel, és Next.js App
Routerben egyszerűen implementálható kliens komponensekből.

**Saját döntés és indok.** A javaslatot **elfogadtam** a következő megfontolásból:
a projekt belső, campus-közösségi alkalmazás — nem tárol banki adatot, fizetési
információt. A `localStorage` XSS-kockázata reális, de az alkalmazás saját
tartalmát jeleníti meg (nem user-generated HTML-t). `httpOnly cookie`
esetén szükség lett volna CSRF-tokenre is, ami a Supertest-alapú integrációs
tesztelést lényegesen bonyolítja (cookie-kezelés tesztkörnyezetben). A
`localStorage` + explicit `Authorization` fejléc kombinációja a Vitest/Supertest
tesztekben egyszerűen szimulálható JWT generálással.

**Ellenőrzés (bizonyíték).** Az `AuthContext` megvalósítása:
[`frontend/src/context/AuthContext.tsx`](./frontend/src/context/AuthContext.tsx).
A backend `authenticateToken` middleware az `Authorization: Bearer` fejlécet
bontja ki: [`backend/src/middleware/auth.ts`](./backend/src/middleware/auth.ts).
A tesztek saját JWT-t generálnak és fejlécként adják át — ez bizonyítja, hogy
a cookie-mentes megközelítés a tesztinfrastruktúrában is zökkenőmentesen működik:
[`backend/tests/helpers.ts`](./backend/tests/helpers.ts).

A részletes kifejtés és a módszer korlátainak leírása:
[`docs/MI_HASZNALAT.md`](./docs/MI_HASZNALAT.md)

## Amit az ügynök NE tegyen

- Ne írja felül a `backend/.env` fájlt és ne szivárogtassa ki a `JWT_SECRET`-et.
- Ne futtasson `prisma:seed`-et ellenőrzés nélkül: törli a meglévő adatokat.
- Ne vezessen be új HTTP kliens/validációs/ORM könyvtárat a meglévők helyett.
- Ne kommitáljon a `main`/`master` ágra külön kérés nélkül.
