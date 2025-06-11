/**
 * Database Migration Runner
 * 
 * This script applies database migrations in sequence
 * to optimize the database structure.
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Get migration number from command line (optional)
const targetMigration = process.argv[2] ? parseInt(process.argv[2]) : null;

/**
 * Apply a single migration file
 */
async function applyMigration(migrationFile) {
  console.log(`\nApplying migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      console.log('Transaction started');
      
      // Run the migration
      await client.query(sql);
      console.log('Migration SQL executed');
      
      // Record migration in migrations table (create if not exists)
      await client.query(`
        CREATE TABLE IF NOT EXISTS applied_migrations (
          id SERIAL PRIMARY KEY,
          migration_name TEXT NOT NULL UNIQUE,
          applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(
        'INSERT INTO applied_migrations (migration_name) VALUES ($1)',
        [migrationFile]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Transaction committed');
      console.log(`✅ Migration ${migrationFile} applied successfully`);
      return true;
    } catch (err) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error(`❌ Error applying migration ${migrationFile}:`, err);
      return false;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`❌ Error reading migration file ${migrationFile}:`, err);
    return false;
  }
}

/**
 * Get all migration files in order
 */
function getMigrationFiles() {
  const files = fs.readdirSync(__dirname)
    .filter(file => {
      // Only include our custom migrations that start with 3-digit numbers
      // This excludes Drizzle-generated migrations that start with 4 digits
      return file.match(/^[0-9]{3}_.+\.sql$/);
    })
    .sort((a, b) => {
      // Extract migration numbers for sorting
      const numA = parseInt(a.split('_')[0]);
      const numB = parseInt(b.split('_')[0]);
      return numA - numB;
    });
  
  console.log("Custom migration files:", files);
  return files;
}

/**
 * Get already applied migrations
 */
async function getAppliedMigrations() {
  try {
    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applied_migrations (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    const result = await pool.query('SELECT migration_name FROM applied_migrations');
    return result.rows.map(row => row.migration_name);
  } catch (err) {
    console.error('Error checking applied migrations:', err);
    return [];
  }
}

/**
 * Run all pending migrations
 */
async function runMigrations() {
  try {
    console.log('Starting database migration process...');
    
    // Get all migration files
    const migrationFiles = getMigrationFiles();
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Get already applied migrations
    const appliedMigrations = await getAppliedMigrations();
    console.log(`Found ${appliedMigrations.length} already applied migrations`);
    
    // Filter for only pending migrations
    const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.includes(file));
    
    // Apply only up to target migration if specified
    let migrationsToApply = pendingMigrations;
    if (targetMigration !== null) {
      migrationsToApply = pendingMigrations.filter(file => {
        const num = parseInt(file.split('_')[0]);
        return num <= targetMigration;
      });
    }
    
    console.log(`Applying ${migrationsToApply.length} migrations`);
    
    // Apply each migration in sequence
    for (const migrationFile of migrationsToApply) {
      const success = await applyMigration(migrationFile);
      
      if (!success) {
        console.error(`\n❌ Migration failed at ${migrationFile}`);
        console.error('Stopping migration process');
        break;
      }
    }
    
    console.log('\nMigration process complete');
  } catch (err) {
    console.error('Fatal error in migration process:', err);
  } finally {
    await pool.end();
  }
}

// Run the migration process
runMigrations().catch(err => {
  console.error('Unhandled error in migration process:', err);
  process.exit(1);
});