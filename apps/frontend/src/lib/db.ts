import mysql, { type RowDataPacket, type OkPacket } from 'mysql2/promise';

// mysql2 accepts these primitive types in parameterised queries
type SqlParam = string | number | boolean | null | Buffer | Date | object;

// Singleton pool — reused across all API route invocations in Next.js
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host:               process.env.DB_HOST     ?? '127.0.0.1',
    database:           process.env.DB_NAME     ?? 'education_local',
    user:               process.env.DB_USER     ?? 'root',
    password:           process.env.DB_PASSWORD ?? '',
    port:               Number(process.env.DB_PORT ?? 3306),
    charset:            'utf8mb4',
    timezone:           '+05:30',           // IST
    connectionLimit:    Number(process.env.DB_CONNECTION_LIMIT ?? 25),
    waitForConnections: true,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 10000,
  });
}

// In development, reuse the pool across hot-reloads (avoids "too many connections")
export const pool: mysql.Pool =
  global._mysqlPool ?? (global._mysqlPool = createPool());

/** Convenience wrapper — returns a typed RowDataPacket array */
export async function query<T extends RowDataPacket[]>(
  sql: string,
  values?: SqlParam[]
): Promise<T> {
    const [rows] = await pool.execute<T>(sql, values as any);
  return rows;
}

/** Convenience wrapper for INSERT / UPDATE / DELETE — returns OkPacket */
export async function execute(
  sql: string,
  values?: SqlParam[]
): Promise<OkPacket> {
    const [result] = await pool.execute<OkPacket>(sql, values as any);
  return result;
}

