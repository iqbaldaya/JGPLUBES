// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  if (process.env.SQL_HOST || process.env.DATABASE_URL) {
    return true;
  }
  return false;
};

export const resetPool = () => {
  // Graceful no-op in normal operation to prevent invalidating Drizzle client references
};

// Function to create or retrieve the connection pool.
export const createPool = (): Pool => {
  if (!global._postgresPool) {
    if (process.env.DATABASE_URL) {
      const rawUrl = process.env.DATABASE_URL.trim();
      const isSslDisabled = rawUrl.toLowerCase().includes('sslmode=disable') || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');
      global._postgresPool = new Pool({
        connectionString: rawUrl,
        ssl: isSslDisabled ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 15000,
      });
    }

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };




