import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'academic_db',
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
