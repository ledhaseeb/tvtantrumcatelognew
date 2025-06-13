import { Pool } from 'pg';

// Global database connection recovery system
export function setupDatabaseRecovery(pool: Pool) {
  // Prevent app crashes from database disconnections
  pool.on('error', (err: any, client: any) => {
    console.error('Database pool error intercepted:', {
      code: err.code,
      message: err.message,
      severity: err.severity,
      timestamp: new Date().toISOString()
    });
    
    // Don't let database errors crash the entire application
    // The pool will automatically create new connections
  });

  // Handle process-level uncaught exceptions from database
  process.on('uncaughtException', (error: any) => {
    if (error.code === '57P01' || error.message?.includes('terminating connection')) {
      console.error('Database connection terminated - gracefully handling:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      // Don't exit the process, let connection pool recover
      return;
    }
    
    // Re-throw non-database errors
    throw error;
  });

  // Monitor pool health
  setInterval(() => {
    const stats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    // Log if pool is having issues
    if (stats.waitingCount > 5) {
      console.warn('Database pool under pressure:', stats);
    }
  }, 60000); // Check every minute

  console.log('Database recovery system initialized');
}

// Wrapper for critical database operations
export async function safeExecute<T>(
  operation: () => Promise<T>, 
  fallback?: T,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = 
        error.code === '57P01' || // admin shutdown
        error.code === 'ECONNRESET' ||
        error.code === 'ENOTFOUND' ||
        error.message?.includes('connection') ||
        error.message?.includes('terminating');

      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, {
        code: error.code,
        message: error.message,
        isConnectionError
      });
      
      if (attempt < maxRetries && isConnectionError) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Retrying database operation in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If we have a fallback and it's a connection error, use it
      if (fallback !== undefined && isConnectionError) {
        console.warn('Using fallback data due to database connection issues');
        return fallback;
      }
      
      throw error;
    }
  }
  
  throw new Error('All database retry attempts failed');
}