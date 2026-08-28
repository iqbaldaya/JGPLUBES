// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool using the object method
export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = process.env.DATABASE_URL;
    const poolConfig = connectionString
      ? {
          connectionString,
          ssl:
            connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
              ? false
              : { rejectUnauthorized: false },
          max: 10,
          connectionTimeoutMillis: 15000,
        }
      : {
          host: process.env.SQL_HOST || '127.0.0.1',
          user: process.env.SQL_USER || 'postgres',
          password: process.env.SQL_PASSWORD || 'postgres',
          database: process.env.SQL_DB_NAME || 'postgres',
          max: 10,
          connectionTimeoutMillis: 15000,
        };

    global._postgresPool = new Pool(poolConfig);

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
