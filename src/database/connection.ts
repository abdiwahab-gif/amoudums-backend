import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

type DbEnvConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function parseMysqlUrl(urlString: string | undefined): Partial<DbEnvConfig> | null {
  if (!urlString) return null;

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'mysql:' && url.protocol !== 'mysql2:') return null;

    const database = url.pathname?.replace(/^\//, '') || undefined;
    return {
      host: url.hostname || undefined,
      port: url.port ? Number(url.port) : undefined,
      user: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      database,
    };
  } catch {
    return null;
  }
}

function getDbConfigFromEnv(): DbEnvConfig {
  const urlConfig =
    parseMysqlUrl(process.env.MYSQL_URL) ??
    parseMysqlUrl(process.env.DATABASE_URL) ??
    parseMysqlUrl(process.env.DATABASE_CONNECTION_STRING) ??
    {};

  const host =
    urlConfig.host ||
    process.env.MYSQLHOST ||
    process.env.DB_HOST ||
    'localhost';

  const port =
    (urlConfig.port && Number.isFinite(urlConfig.port) ? urlConfig.port : undefined) ||
    (process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : undefined) ||
    (process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined) ||
    3306;

  const user =
    urlConfig.user ||
    process.env.MYSQLUSER ||
    process.env.DB_USER ||
    'root';

  const password =
    urlConfig.password ||
    process.env.MYSQLPASSWORD ||
    process.env.DB_PASSWORD ||
    '';

  const database =
    urlConfig.database ||
    process.env.MYSQLDATABASE ||
    process.env.DB_NAME ||
    'academic_db';

  // Helpful warning for common Render misconfiguration.
  if (
    process.env.NODE_ENV === 'production' &&
    host === 'localhost' &&
    !process.env.DB_HOST &&
    !process.env.MYSQLHOST &&
    !process.env.MYSQL_URL &&
    !process.env.DATABASE_URL
  ) {
    console.warn(
      '[DB] Using localhost in production. Render does not provide a MySQL server; set MYSQL_URL (Railway) or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME env vars.'
    );
  }

  return { host, port, user, password, database };
}

const dbConfig = getDbConfigFromEnv();

const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function getConnection() {
  const connection = await pool.getConnection();
  return connection;
}

export async function query<T>(sql: string, values?: any[]): Promise<T[]> {
  const [results] = await pool.query(sql, values);
  return results as T[];
}

export async function execute(sql: string, values?: any[]) {
  const [result] = await pool.execute(sql, values);
  return result;
}

export default pool;
