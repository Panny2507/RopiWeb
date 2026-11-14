# Tesztelés és hibafeltárás — RopiWeb backend

Ez a dokumentum az elfogadási feltételekhez rendeli az ellenőrzési módokat, és
bemutatja a futtatható automatizált teszteket, valamint a hibás → javított
változat regressziós bizonyítékát.

## Hogyan futnak a tesztek

- Keretrendszer: **Vitest** (futtató) + **Supertest** (HTTP-szintű integrációs
  tesztek az Express app ellen).
- A tesztek **külön, eldobható adatbázist** használnak
  (`backend/prisma/test.db`), amit a `tests/global-setup.ts` minden futás elején
  nulláról épít fel (`prisma db push`). A fejlesztői `dev.db` érintetlen marad.
- A tesztek sorosan futnak (közös adatbázis), és minden teszt előtt a
  `resetDatabase()` kiüríti a táblákat.

Futtatás:

```bash
cd backend
npm test
```

## Elfogadási feltételek → ellenőrzési mód megfeleltetés

A számozás a specifikáció (EF-1..EF-8) szerinti.

| EF | Típus | Szabály | Ellenőrzés módja | Hol |
|---|---|---|---|---|
| EF-1 | normál | Jelentkezés szabad edzésre (létszám < max) → ACCEPTED (201) | automatizált teszt | `tests/registrations.test.ts` |
| EF-2 | határeset | Jelentkezés betelt edzésre → WAITLISTED, az elfogadott létszám nem nő | automatizált teszt | `tests/registrations.test.ts` |
| EF-3 | hibás bemenet | Edzés kiírása hiányos/múltbeli adatokkal → HTTP 400 | automatizált teszt | `tests/trainings.test.ts` |
| EF-4 | határeset | Ismételt jelentkezés ugyanarra az edzésre → HTTP 409 (duplikáció elutasítva) | automatizált teszt | `tests/registrations.test.ts` |
| EF-5 | jogosultság | Sima felhasználó admin API-t hív → HTTP 403 + audit bejegyzés | automatizált teszt | `tests/authorization.test.ts` |
| EF-6 | normál | Röpikupa csapatnevezés érvényes adatokkal → DB-be mentés, SUBMITTED státusz, listában megjelenik | automatizált teszt | `tests/cup.test.ts` |
| EF-7 | határeset | Elfogadott jelentkezés lemondása betelt edzésen → a várólista 1. helyezettje automatikusan átkerül az elfogadott keretbe | automatizált teszt (regressziós) | `tests/registrations.test.ts` |
| EF-8 | normál | Üzenet küldése az „Üzenj nekünk” modulból → DB-be mentés, admin nézetben megjelenik | automatizált teszt | `tests/messages.test.ts` |

## A pontozási útmutató által kért esetek lefedettsége

- **Normál eset:** szabad helyre való jelentkezés → `ACCEPTED`, HTTP 201 (EF-1).
  (`tests/registrations.test.ts` → „szabad helyre jelentkezve ACCEPTED…”)
  További normál esetek: EF-6 kupanevezés (`cup.test.ts`), EF-8 üzenetküldés
  (`messages.test.ts`).
- **Érdemi határeset 1 (EF-2):** a maximális létszámot pontosan betöltő
  jelentkezés még `ACCEPTED`, a rögtön utána érkező már `WAITLISTED`.
  (`tests/registrations.test.ts` → „az utolsó szabad hely ACCEPTED…”)
- **Érdemi határeset 2 (EF-7):** egy `ACCEPTED` résztvevő lemondása után a
  várólista első eleme automatikusan `ACCEPTED` lesz.
  (`tests/registrations.test.ts` → FIFO regressziós teszt)
- **Hibás bemenet / jogosulatlan művelet:**
  - múltbeli dátummal edzés létrehozása → 400 (EF-3, `trainings.test.ts`)
  - hiányzó kötelező mező → 400 (EF-3, `trainings.test.ts`)
  - token nélküli jelentkezés → 401 (`registrations.test.ts`)
  - duplikált jelentkezés → 409 (EF-4, `registrations.test.ts`)
  - USER szerepkör admin-végponton → 403 (EF-5, `authorization.test.ts`)
  - szabályzat elfogadása nélküli kupanevezés → 400 (`cup.test.ts`)
  - érvénytelen email üzenetnél → 400 (`messages.test.ts`)
- **Regressziós eset:** a FIFO-előreléptetés tesztje (EF-7, lásd lentebb), amely
  a szándékosan hibás változaton elbukik, a javítotton átmegy.

## Regressziós eset: várólista FIFO-előreléptetés (EF-7)

**A szabály (EF-7).** Amikor egy `ACCEPTED` résztvevő lemondja a jelentkezését, a
felszabaduló helyre a várólistáról a **legkorábban jelentkezett** (legkisebb
`position` értékű) felhasználót kell előléptetni. Ez a tisztességes (first in,
first served) sorrend.

**A hiba (szándékosan behelyezett változat).** A
`backend/src/routes/registrations.ts` lemondás-logikájában a várólistás
kiválasztása rossz irányban rendez:

```ts
// HIBÁS változat:
orderBy: { position: 'desc' }   // a LEGKÉSŐBBI várólistást léptetné elő
```

**Az elvárt (javított) működés.**

```ts
// JAVÍTOTT változat:
orderBy: { position: 'asc' }    // a LEGKORÁBBI várólistást lépteti elő
```

**A teszt.** `tests/registrations.test.ts` →
„ACCEPTED lemondásakor a legkorábbi várólistás lép elő (FIFO regresszió)”.
Három felhasználó jelentkezik egy 1 férőhelyes edzésre (1 ACCEPTED + 2
WAITLISTED), majd az ACCEPTED lemond. A teszt azt várja, hogy az **első**
várólistás (`w1@test.hu`) lépjen elő.

**Bizonyíték (a két futás elmentett kimenete):**

- Hibás változaton elbukik: [`evidence/regression-FAIL-buggy.txt`](./evidence/regression-FAIL-buggy.txt)
  — a teszt `w1@test.hu`-t vár, de `w2@test.hu`-t kap (a legkésőbbi várólistás
  lépett elő).
- Javított változaton átmegy: [`evidence/regression-PASS-fixed.txt`](./evidence/regression-PASS-fixed.txt)
  — 1 passed.

A két futás reprodukálható: a `src/routes/registrations.ts` lemondás-ágában az
`orderBy: { position: 'asc' }` sort `'desc'`-re állítva fut le a hibás eset,
visszaállítva a javított eset.

## Teljes futás eredménye

A teljes, javított változat tesztfutásának elmentett kimenete:
[`evidence/full-suite-PASS.txt`](./evidence/full-suite-PASS.txt) — 20 teszt, mind zöld
(5 tesztfájl: jelentkezés, edzés, kupa, jogosultság, üzenet).
