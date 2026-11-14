# Az MI használatának dokumentálása — RopiWeb

Ez a dokumentum az MI-eszközök érdemi használatát mutatja be a fejlesztés
legalább három fázisában (követelményelemzés, implementáció, tesztelés). A puszta
felsorolás helyett konkrét döntési eseteket rögzít: a problémát, az eszközt, az
MI-nek átadott releváns kontextust és utasítást, a javaslat lényegét, a saját
döntést és annak szakmai indokát, végül az ellenőrzés bizonyítékát.

## Használt MI-eszközök és projekt-szintű konfiguráció

- **Google Antigravity (AGY)** — Claude Opus 4.6 / Gemini Flash modellek,
  agentic mód, párhuzamos subagent-architektúra — architektúra, implementáció
  és UI-iteráció fázisokban.
- **Kiro** (agentic IDE) — tesztstratégia, tesztkörnyezet felállítása, tesztek
  írása, regressziós hibademó.
- Projekt-szintű MI-támogató elemek:
  - [`AGENTS.md`](../AGENTS.md) — ügynök-útmutató: parancsok, konvenciók,
    tesztelési és jogosultsági szabályok, tiltások.
  - [`docs/TESZTELES.md`](./TESZTELES.md) — elfogadási feltételek → tesztek
    megfeleltetés és a regressziós bizonyíték leírása.
  - A tesztek a `backend/tests/` mappában, futtatható módon (`npm test`).

---

## 1. döntési eset — Követelményelemzés / tesztstratégia

**Probléma.** Melyek a backend „lényeges programozott szabályai”, amelyekre
érdemes automatizált tesztet írni, és hogyan feleltessük meg ezeket az
elfogadási feltételeknek?

**Eszköz.** Kiro.

**Átadott kontextus és utasítás.** Átadtam a backend route-jait
(`registrations.ts`, `trainings.ts`, `cup.ts`, `auth.ts`), a
`middleware/validate.ts` és `middleware/auth.ts` fájlokat, valamint a Prisma
sémát. Utasítás: azonosítsa a kódban kommentekkel jelölt elfogadási feltételeket
(EF-3, EF-4, EF-5) és a tesztelésre érdemes üzleti szabályokat.

**A javaslat lényege.** Az MI a jelentkezési logikát (létszámkorlát →
ACCEPTED/WAITLISTED, duplikáció → 409, lemondás utáni előreléptetés), az
edzés-validációt (EF-3) és a jogosultság-ellenőrzést (EF-5) jelölte meg mint a
legkockázatosabb, legtöbb elágazást tartalmazó szabályokat.

**Saját döntés és indok.** A javaslatot **elfogadtam**, mert ezek valóban
állapotfüggő, elágazásokban gazdag szabályok, szemben a tisztán CRUD-jellegű
végpontokkal. A megfeleltetést rögzítettem a `docs/TESZTELES.md` táblázatában,
így minden teszt visszavezethető egy konkrét elfogadási feltételre.

**Ellenőrzés (bizonyíték).** A megfeleltetés és a lefedett esetek:
[`docs/TESZTELES.md`](./TESZTELES.md); a teljes zöld futás:
[`evidence/full-suite-PASS.txt`](./evidence/full-suite-PASS.txt).

---

## 2. döntési eset — Implementáció / teszt-infrastruktúra

**Probléma.** A tesztek ne a fejlesztői adatbázist (`dev.db`) használják, mert
az tönkretenné a seedelt adatokat. Kellett egy izolált, reprodukálható
tesztkörnyezet az Express + Prisma rendszerhez.

**Eszköz.** Kiro.

**Átadott kontextus és utasítás.** Átadtam, hogy az `index.ts` `export default
app`-ot ad és van `NODE_ENV !== 'test'` guard a `listen`-nél; a
`lib/prisma.ts` a `DATABASE_URL`-ből olvas. Utasítás: állítson fel Vitest +
Supertest környezetet külön teszt-adatbázissal, a `dev.db` érintése nélkül.

**A javaslat lényege.** Az MI kezdetben a környezeti változókat egy
importált modulban akarta beállítani. Ez viszont kockázatos: a Prisma kliens a
`DATABASE_URL`-t a modul betöltésekor rögzíti, így ha az app-kód az env beállítása
ELŐTT töltődik be, a tesztek a `dev.db`-re futnának.

**Saját döntés és indok.** A javaslatot **módosítottam**: a környezeti
változókat egy külön, app-kódot NEM importáló `tests/setup.ts` fájlba tettem, és
ezt a Vitest `setupFiles`-be regisztráltam, hogy biztosan az app/Prisma betöltése
ELŐTT fusson. A séma-előkészítést pedig egy `globalSetup`-ba
(`tests/global-setup.ts`) emeltem, amely a teszt-adatbázist nulláról építi fel.
Indok: a betöltési sorrend determinisztikus garantálása, és a `dev.db` teljes
izolációja.

**Ellenőrzés (bizonyíték).** A tesztek a `file:./test.db`-re futnak (a
`global-setup` kimenete: „SQLite database test.db …”), a `dev.db` változatlan.
A működő futás: [`evidence/full-suite-PASS.txt`](./evidence/full-suite-PASS.txt).
Konfiguráció: `backend/vitest.config.ts`, `backend/tests/setup.ts`,
`backend/tests/global-setup.ts`.

---

## 3. döntési eset — Implementáció / szerepkör-validáció módja

**Probléma.** Az admin a felhasználók szerepkörét módosíthatja
(`PATCH /api/admin/users/:id`). A bejövő `role` értéket ellenőrizni kell, mert
csak három érvényes érték létezik: `GUEST`, `USER`, `ADMIN`. A kérdés: hogyan
ellenőrizzük az engedélyezett értékeket úgy, hogy a kód olvasható és a jövőbeli
bővítésnél (`prisma:push` utáni új szerepkör) könnyen karbantartható maradjon?

**Eszköz.** Kiro.

**Átadott kontextus és utasítás.** Átadtam az `admin.ts` szerepkör-módosító
ágát és a Prisma `User.role` mezőt (string, alapértelmezett `USER`). Utasítás:
javasoljon megbízható, olvasható validációt az engedélyezett szerepkörökre, és
hibás érték esetén adjon beszédes HTTP 400 választ.

**A javaslat lényege.** Két megközelítés merült fel: (a) explicit engedélyezett
lista + tömbtagság-ellenőrzés `includes()`-szel
(`const validRoles = ['GUEST','USER','ADMIN']; validRoles.includes(role)`),
illetve (b) hosszú `if/else if` láncú összehasonlítás minden szerepkörre. Az MI
az `includes()`-es, listaalapú megoldást javasolta.

**Saját döntés és indok.** A javaslatot **elfogadtam**. Az `includes()`-es
változat mellett szól, hogy az engedélyezett értékek egyetlen helyen, egy
listában vannak felsorolva: új szerepkör bevezetésekor elég a listát bővíteni, a
feltétel változatlan marad, és a hibaüzenet is a listából generálódik
(`validRoles.join(', ')`), így sosem csúszik szét a kód és a felhasználónak
mutatott érvényes értékek halmaza. Ez kevésbé törékeny és rövidebb, mint a
kézi `if`-láncok, amelyeknél könnyű egy ágat kifelejteni.

**Ellenőrzés (bizonyíték).**
- A megvalósítás az `backend/src/routes/admin.ts`-ben:
  `const validRoles = ['GUEST', 'USER', 'ADMIN']; if (!validRoles.includes(role)) { ...400... }`.
- A jogosultság- és szerepkör-kezelést a jogosultsági tesztek fedik
  (`tests/authorization.test.ts`): a 200/403/401 válaszok, és az ADMIN által
  elérhető `GET /api/admin/users` végpont. A teljes zöld futás:
  [`evidence/full-suite-PASS.txt`](./evidence/full-suite-PASS.txt).

> Megjegyzés: a hibás → javított változat regressziós bizonyítékát (a FIFO
> várólista-előreléptetés tesztje) a tesztelési követelmény külön tárgyalja, lásd
> [`docs/TESZTELES.md`](./TESZTELES.md) „Regressziós eset (EF-7)” szakasz és a
> `evidence/regression-FAIL-buggy.txt` / `evidence/regression-PASS-fixed.txt`
> fájlok. Ezt nem MI-döntési esetként, hanem a tesztek hibafogó képességének
> igazolásaként dokumentáljuk.

---

## A módszer korlátai

- A tesztek integrációs szinten, SQLite-tal futnak; a tényleges éles adatbázis
  (más motor, párhuzamos terhelés) eltérő viselkedést mutathat, különösen a
  tranzakciós versenyhelyzeteknél.
- Az MI-javaslatok a megadott kontextusra épülnek; hiányos kontextus esetén
  reális, de a projektkonvencióktól eltérő mintát javasolhat (lásd a 2. eset
  betöltési sorrend problémáját), ezért minden érdemi javaslatot futtatással
  ellenőriztem.
- A tesztek a jelen lefedett szabályokra adnak biztosítékot; a nem tesztelt
  végpontok (pl. fájlfeltöltés, üzenetkezelés) további lefedést igényelnek.
- A regressziós hiba szándékosan behelyezett, nem valós fejlesztési hibát
  reprodukál; a cél a tesztek hibafogó képességének bizonyítása.
