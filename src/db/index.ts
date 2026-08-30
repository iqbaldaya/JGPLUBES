// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = (): boolean => {
  const conn = process.env.DATABASE_URL;
  if (conn && conn.trim().length > 0 && !conn.includes('YOUR_DATABASE_URL')) {
    return true;
  }
  if (process.env.SQL_HOST && process.env.SQL_HOST !== '127.0.0.1' && process.env.SQL_HOST !== 'localhost') {
    return true;
  }
  return false;
};

function getSSLConfig(connectionString: string) {
  const cleanStr = connectionString.trim().toLowerCase();

  // Local connections: No SSL
  if (cleanStr.includes('localhost') || cleanStr.includes('127.0.0.1')) {
    return false;
  }

  // Explicitly disabled
  if (cleanStr.includes('sslmode=disable')) {
    return false;
  }

  // Render Internal URL check (e.g. postgres://user:pass@dpg-xxxxx-a:5432/dbname)
  // Internal connections in Render's private network do not use SSL
  try {
    const url = new URL(connectionString);
    const host = url.hostname.toLowerCase();
    if (host.startsWith('dpg-') && !host.includes('.')) {
      return false;
    }
    if (host.endsWith('.internal')) {
      return false;
    }
  } catch {
    if (/dpg-[a-z0-9]+:5432/i.test(cleanStr) && !cleanStr.includes('.render.com')) {
      return false;
    }
  }

  // External URLs (e.g. *.render.com, neon, supabase, aws) require SSL
  return { rejectUnauthorized: false };
}

// Function to create or retrieve the connection pool using the object method
export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    const isConfigured = isDatabaseConfigured();

    const poolConfig = isConfigured && connectionString
      ? {
          connectionString,
          ssl: getSSLConfig(connectionString),
          max: 10,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        }
      : {
          host: process.env.SQL_HOST || '127.0.0.1',
          user: process.env.SQL_USER || 'postgres',
          password: process.env.SQL_PASSWORD || 'postgres',
          database: process.env.SQL_DB_NAME || 'postgres',
          max: 10,
          connectionTimeoutMillis: 5000,
        };

    global._postgresPool = new Pool(poolConfig);

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool event:', err.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };


