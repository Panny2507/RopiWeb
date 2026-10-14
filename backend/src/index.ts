import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import trainingsRoutes from './routes/trainings';
import registrationsRoutes from './routes/registrations';
import cupRoutes from './routes/cup';
import messagesRoutes from './routes/messages';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS konfiguráció - Frontend http://localhost:3000 és http://127.0.0.1:3000 engedélyezése
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.CORS_ORIGIN || '',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev környezetben engedékeny
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Egyszerű kérés-naplózás fejlesztési környezetben
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Alap healthcheck végpont
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'BME VIK Röplabda Kör API',
    timestamp: new Date().toISOString(),
  });
});

// REST API Route-ok felcsatolása
app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/cup', cupRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/admin', adminRoutes);

// Nem létező végpontok kezelése (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `A kért végpont nem található: ${req.method} ${req.originalUrl}`,
  });
});

// Globális hibakezelő middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Nem kezelt szerverhiba:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Belső szerverhiba történt',
  });
});

// Szerver indítása
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🏐 BME VIK Röplabda Kör REST API szerver fut!`);
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🌐 CORS engedélyezve: http://localhost:3000`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
}

export default app;
