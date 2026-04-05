import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiUrl: process.env.API_URL || 'http://localhost:5000',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'academic_db',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  // CORS
  cors: {
    // Supports a single origin or a comma-separated allowlist.
    // Examples:
    //   CORS_ORIGIN=http://localhost:3000
    //   CORS_ORIGIN=https://amoudums.vercel.app,http://localhost:3000
    origin: (() => {
      const raw = (process.env.CORS_ORIGIN || 'http://localhost:3000').trim();
      const origins = raw
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      return origins.length <= 1 ? origins[0] : origins;
    })(),
    credentials: true,
  },

  // Email (Optional)
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
};
