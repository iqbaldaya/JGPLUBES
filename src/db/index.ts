// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Global connection pool caching to persist across hot-reloads
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

function getCleanConnectionStringAndSSL(rawUrl: string): { connectionString: string; ssl: any } {
  let cleanStr = rawUrl.trim();
  let host = '';

  try {
    const parsed = new URL(cleanStr);
    host = parsed.hostname.toLowerCase();
    // Remove conflicting query params so pg doesn't override explicit SSL configuration
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    cleanStr = parsed.toString();
  } catch {
    // If URL parsing fails, inspect string directly
    const match = cleanStr.match(/@([^:/]+)/);
    if (match) {
      host = match[1].toLowerCase();
    }
  }

  // 1. Local connections: No SSL
  if (host === 'localhost' || host === '127.0.0.1' || cleanStr.includes('localhost') || cleanStr.includes('127.0.0.1')) {
    return { connectionString: cleanStr, ssl: false };
  }

  // 2. Explicit disable flag
  if (rawUrl.toLowerCase().includes('sslmode=disable')) {
    return { connectionString: cleanStr, ssl: false };
  }

  // 3. Render Internal URL (e.g. host is dpg-xxxxxx-a without dots, or ends with .internal)
  if ((host.startsWith('dpg-') && !host.includes('.')) || host.endsWith('.internal')) {
    return { connectionString: cleanStr, ssl: false };
  }

  // 4. External Render PostgreSQL, AWS, Supabase, Neon, etc. require SSL with loose cert check
  return {
    connectionString: cleanStr,
    ssl: { rejectUnauthorized: false },
  };
}

export const resetPool = () => {
  if (global._postgresPool) {
    try {
      global._postgresPool.end().catch(() => {});
    } catch {}
    global._postgresPool = undefined;
  }
};

// Function to create or retrieve the connection pool
export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const rawConnectionString = process.env.DATABASE_URL;
    const isConfigured = isDatabaseConfigured();

    if (isConfigured && rawConnectionString) {
      const { connectionString, ssl } = getCleanConnectionStringAndSSL(rawConnectionString);
      global._postgresPool = new Pool({
        connectionString,
        ssl,
        max: 10,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
    } else {
      global._postgresPool = new Pool({
        host: process.env.SQL_HOST || '127.0.0.1',
        user: process.env.SQL_USER || 'postgres',
        password: process.env.SQL_PASSWORD || 'postgres',
        database: process.env.SQL_DB_NAME || 'postgres',
        max: 5,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      });
    }

    // Prevent unhandled pool-level errors from crashing Node process
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL pool connection notice:', err?.message || err);
      // Reset pool on broken pipe or connection termination so next query creates a fresh client
      if (err?.message?.includes('EPIPE') || err?.message?.includes('ECONNRESET')) {
        resetPool();
      }
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export { schema };



