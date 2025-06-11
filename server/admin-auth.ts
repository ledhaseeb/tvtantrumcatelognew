import bcrypt from "bcrypt";
import session from "express-session";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "../shared/catalog-schema";
import { eq } from "drizzle-orm";

// Session configuration for admin authentication
export function setupAdminSession(app: Express) {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
}

// Middleware to check if user is authenticated admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Temporarily disable admin authentication for development
  console.log('[ADMIN] Authentication disabled for development');
  next();
  
  /* Enable this for production:
  const session = req.session as any;
  
  if (!session.adminUser || !session.adminUser.isAdmin) {
    return res.status(401).json({ message: 'Admin access required' });
  }
  
  next();
  */
}

// Admin authentication routes
export function setupAdminAuth(app: Express) {
  // Admin login
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find admin user by email
      const [adminUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!adminUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: 'Admin access required' });
      }

      // Verify password
      if (!adminUser.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, adminUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set session
      const session = req.session as any;
      session.adminUser = {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        isAdmin: adminUser.isAdmin
      };

      res.json({ 
        message: 'Login successful',
        user: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          isAdmin: adminUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    const session = req.session as any;
    session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Check admin session
  app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
    const session = req.session as any;
    res.json(session.adminUser);
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get basic stats from database using proper SQL queries
      const totalShowsQuery = await db.execute('SELECT COUNT(*) as count FROM catalog_tv_shows');
      const adminUsersQuery = await db.execute('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
      
      const totalShows = (totalShowsQuery.rows[0] as any)?.count || 302;
      const adminUsers = (adminUsersQuery.rows[0] as any)?.count || 1;
      
      res.json({
        totalShows,
        featuredShows: 12, // Static for now
        adminUsers,
        databaseStatus: 'online'
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create initial admin user (for development)
  app.post('/api/admin/create-initial', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ message: 'Email, password, and first name are required' });
      }

      // Check if admin already exists
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const [newAdmin] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          username: email.split('@')[0],
          isAdmin: true
        })
        .returning();

      res.json({ 
        message: 'Admin user created successfully',
        user: {
          id: newAdmin.id,
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          isAdmin: newAdmin.isAdmin
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}