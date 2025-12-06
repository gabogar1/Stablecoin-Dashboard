import { Pool, type QueryResult } from 'pg';

let pool: Pool | null = null;

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Please add it to your environment.');
  }

  const normalized = connectionString.toLowerCase();
  const sslDisabled =
    normalized.includes('sslmode=disable') || normalized.includes('ssl=false');

  // Default to SSL with relaxed verification unless explicitly disabled.
  const ssl = sslDisabled ? undefined : { rejectUnauthorized: false };

  return new Pool({
    connectionString,
    ssl,
    max: 10,
  });
}

export function getDb(): Pool {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

export async function query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
  const db = getDb();
  return db.query<T>(text, params);
}

