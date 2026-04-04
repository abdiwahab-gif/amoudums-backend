import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from '@/config';
import { initializeTables } from '@/database/schema';
import { addSecurityEnhancements } from '@/database/security-migrations';
import { ensureInitialAdminUser } from '@/database/seed';
import authRoutes from '@/routes/auth-enhanced.routes';
import studentRoutes from '@/routes/student.routes';
import userRoutes from '@/routes/user.routes';
import zktecoDeviceRoutes, { zktecoApiRoutes } from './routes/zkteco.routes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/zkteco', zktecoApiRoutes);

// ZKTeco device endpoints (must be top-level and unauthenticated)
app.use('/iclock', zktecoDeviceRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Start Server
async function startServer() {
  try {
    // Initialize database tables
    console.log('Initializing database tables...');
    await initializeTables();

    // Apply security and compatibility migrations for auth/user flows
    console.log('Applying security enhancements...');
    await addSecurityEnhancements();

    // Optional: seed initial admin user (only when env vars are set)
    try {
      const seedResult = await ensureInitialAdminUser();
      if (seedResult.created) {
        console.log('✓ Seeded initial admin user');
      }
    } catch (e: any) {
      console.warn('⚠ Initial admin seeding skipped/failed:', e?.message || e);
    }

    const listenWithRetry = async (
      startPort: number,
      maxAttempts: number = 10
    ): Promise<number> => {
      return await new Promise((resolve, reject) => {
        const attempt = (port: number, attemptIndex: number) => {
          const server = app.listen(port, () => resolve(port));

          server.once("error", (err: any) => {
            if (err?.code === "EADDRINUSE" && attemptIndex < maxAttempts - 1) {
              const nextPort = port + 1;
              console.warn(`⚠ Port ${port} is already in use. Trying ${nextPort}...`);
              server.close(() => attempt(nextPort, attemptIndex + 1));
              return;
            }
            reject(err);
          });
        };

        attempt(startPort, 0);
      });
    };

    const requestedPort = config.port;
    const boundPort = await listenWithRetry(requestedPort);
    const boundUrl = `http://localhost:${boundPort}`;

    console.log(`✓ Server running on ${boundUrl}`);
    if (boundPort !== requestedPort) {
      console.log(
        `⚠ Requested port ${requestedPort} was busy; using ${boundPort} instead.`
      );
    }
    console.log(`✓ API URL: ${process.env.API_URL || boundUrl}`);
    console.log(`✓ Environment: ${config.nodeEnv}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

export default app;

// Start if not imported as module
if (require.main === module) {
  startServer();
}
