
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Configure the pool with optimized settings for viral traffic loads
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 50, // Dramatically increased for viral traffic (from 20)
  min: 10, // Higher minimum connections for instant response
  idleTimeoutMillis: 600000, // 10 minutes - keep connections alive longer
  connectionTimeoutMillis: 20000, // 20 seconds - increased for viral load
  acquireTimeoutMillis: 60000, // 60 seconds - longer wait for viral spikes
  createTimeoutMillis: 40000, // 40 seconds to create new connection
  destroyTimeoutMillis: 5000, // 5 seconds to destroy connection
  reapIntervalMillis: 2000, // Check for idle connections every 2 seconds
  createRetryIntervalMillis: 100, // Faster retry for viral traffic (200ms -> 100ms)
  ssl: { rejectUnauthorized: false },
  application_name: 'tv-tantrum-viral',
  // Additional optimizations for viral traffic
  statement_timeout: 30000, // 30 second query timeout
  query_timeout: 25000, // 25 second individual query timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 0
};

export const pool = new Pool(poolConfig);

// Add error handling for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(-1);
  }
});

// Add connect handling
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('Database client error:', err);
  });
});

// Initialize Drizzle ORM with the pool
export const db = drizzle(pool, { schema });

// Export a helper function to check DB connection
export async function checkDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('Database connected successfully at:', result.rows[0].now);
    
    // Check if users table exists
    const tablesCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tablesCheck.rows[0].exists) {
      console.log('Users table does not exist yet');
      return true;
    }
    
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Database connection verified. User count: ${userCount.rows[0].count}`);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('Continuing in development mode despite database error');
      return true;
    }
    return false;
  } finally {
    if (client) client.release();
  }
}
