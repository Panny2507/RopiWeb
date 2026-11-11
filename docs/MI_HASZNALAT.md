# Az MI használatának dokumentálása — RopiWeb

Ez a dokumentum az MI-eszközök érdemi használatát mutatja be a fejlesztés
legalább három fázisában (követelményelemzés, implementáció, tesztelés). A puszta
felsorolás helyett konkrét döntési eseteket rögzít: a problémát, az eszközt, az
MI-nek átadott releváns kontextust és utasítást, a javaslat lényegét, a saját
döntést és annak szakmai indokát, végül az ellenőrzés bizonyítékát.

## Használt MI-eszközök és projekt-szintű konfiguráció

- **Kiro** (agentic IDE) — a tesztkörnyezet felállítása, tesztek írása, a
  regressziós hibademó és a dokumentáció.
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

## 3. döntési eset — Tesztelés / regressziós hibademó

**Probléma.** Igazolni kell egy teszttel, hogy ismert hibás változaton elbukik,
a javítotton átmegy. Kellett egy olyan, üzletileg lényeges szabály, ahol a hiba
reális és egyértelmű.

**Eszköz.** Kiro.

**Átadott kontextus és utasítás.** Átadtam a `registrations.ts` lemondás-ágát,
ahol ACCEPTED lemondásakor a várólistáról `orderBy: { position: 'asc' }`
szerint lép elő a következő. Utasítás: javasoljon egy reális, szándékosan
behelyezett hibát, amely a tisztességes (FIFO) sorrendet sérti, és írjon rá
tesztet, amely a hibát elkapja.

**A javaslat lényege.** Az MI azt javasolta, hogy a rendezést fordítsuk meg
(`'asc'` → `'desc'`), így a legkésőbb jelentkezett várólistás lépne elő, ami
sérti a FIFO elvet. A teszt három felhasználót állít be (1 ACCEPTED + 2
WAITLISTED), az ACCEPTED lemond, és azt várja, hogy az ELSŐ várólistás lépjen elő.

**Saját döntés és indok.** A javaslatot **elfogadtam**, mert a hiba életszerű
(elírt rendezési irány), a hatása pedig közvetlenül igazságtalan sorrendet okoz,
így jól demonstrálja a teszt értékét. A hibás és a javított változatot is
megőriztem, és mindkét futás kimenetét elmentettem. A hibás részletet a
dokumentáció egyértelműen szándékosnak jelöli — **ez nem tényleges fejlesztési
hiba**.

**Ellenőrzés (bizonyíték).**
- Hibás változat elbukik:
  [`evidence/regression-FAIL-buggy.txt`](./evidence/regression-FAIL-buggy.txt)
  (`expected 'w2@test.hu' to be 'w1@test.hu'`).
- Javított változat átmegy:
  [`evidence/regression-PASS-fixed.txt`](./evidence/regression-PASS-fixed.txt)
  (1 passed).
- A szabály és a két változat leírása: [`docs/TESZTELES.md`](./TESZTELES.md)
  („Regressziós eset” szakasz).

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
