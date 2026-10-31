# RopiWeb

BME VIK Röplabda Kör weboldala. A projekt egy Next.js frontendből és egy
Express/Prisma alapú REST API backendből áll.

## Előfeltételek

- Node.js `22.22.2` vagy újabb kompatibilis verzió (`24.15.0` vagy `26+`)
- npm `12.2.1`

## Telepítés

A frontend és a backend külön npm projekt, ezért mindkettőben telepíteni kell a
függőségeket.

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

## Backend beállítása

A backend a `backend\.env` fájlból olvassa a konfigurációt. A repository
tartalmaz egy fejlesztési beállítást; ha a fájl hiányzik, hozd létre az alábbi
tartalommal:

```env
PORT=3001
DATABASE_URL="file:./dev.db"
JWT_SECRET="ropiweb-super-secret-jwt-key-2026"
CORS_ORIGIN="http://localhost:3000"
```

Ezután generáld le a Prisma klienst, és készítsd elő az adatbázist:

```powershell
cd backend
npx prisma generate
npx prisma db push
```

### Kezdeti tesztadatok betöltése

Ha a felületet előre feltöltött adatokkal szeretnéd használni, futtasd:

```powershell
cd backend
npm run prisma:seed
```

**Figyelem:** a seedelés törli a jelenlegi adatokat, majd új tesztadatokat
hoz létre.

A seedelt tesztfelhasználók:

| Szerepkör | E-mail | Jelszó |
|---|---|---|
| Admin | `admin@ropikor.hu` | `admin123` |
| Felhasználó | `felhasznalo1@edu.bme.hu` | `user123` |

## Futtatás fejlesztői módban

Indítsd el a backendet és a frontendet két külön terminálban.

**1. terminál – backend:**

```powershell
cd backend
npm run dev
```

**2. terminál – frontend:**

```powershell
cd frontend
npm run dev
```

Az alkalmazás ezután a következő címeken érhető el:

- Frontend: <http://localhost:3000>
- Backend health check: <http://localhost:3001/api/health>

A frontend az `/api` kéréseket automatikusan a `http://localhost:3001` backend
felé továbbítja.

## Build és futtatás production módban

Mindkét alkalmazást külön kell buildelni.

**Backend:**

```powershell
cd backend
npm run build
npm start
```

**Frontend – másik terminálban:**

```powershell
cd frontend
npm run build
npm start
```

A production frontend továbbra is a 3000-es, a backend pedig alapértelmezés
szerint a 3001-es porton indul. A portok a `backend\.env` fájlban, illetve a
frontend `package.json` scriptjeiben módosíthatók.

## Hasznos parancsok

### Backend

```powershell
npm run dev              # fejlesztői szerver automatikus újraindítással
npm run build            # TypeScript fordítása a dist mappába
npm start                # lefordított backend indítása
npm run prisma:generate  # Prisma kliens generálása
npm run prisma:push      # Prisma séma alkalmazása az adatbázisra
npm run prisma:seed      # tesztadatok betöltése
```

### Frontend

```powershell
npm run dev    # Next.js fejlesztői szerver
npm run build  # production build készítése
npm start      # production build indítása
npm run lint   # lint ellenőrzés
```
