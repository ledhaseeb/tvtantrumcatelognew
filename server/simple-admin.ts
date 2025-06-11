import bcrypt from 'bcrypt';
import type { Express, Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

// Direct database connection for admin authentication
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Simple middleware to check admin authentication
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  if (!session.adminUser) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

export function setupSimpleAdminAuth(app: Express) {
  // Admin login
  app.post('/api/admin/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Query user directly with SQL
      const result = await pool.query(
        'SELECT id, email, first_name, password, is_admin FROM users WHERE email = $1 AND is_admin = true',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Set session
      const session = req.session as any;
      session.adminUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        isAdmin: user.is_admin
      };

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  // Get current admin user
  app.get('/api/admin/me', requireAdmin, (req: Request, res: Response) => {
    const session = req.session as any;
    res.json(session.adminUser);
  });

  // Admin stats
  app.get('/api/admin/stats', requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get stats using direct SQL queries
      const showsResult = await pool.query('SELECT COUNT(*) as count FROM catalog_tv_shows');
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users WHERE is_admin = true');
      
      const totalShows = parseInt(showsResult.rows[0]?.count || '302');
      const adminUsers = parseInt(usersResult.rows[0]?.count || '1');
      
      res.json({
        totalShows,
        featuredShows: 12,
        adminUsers,
        databaseStatus: 'online'
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all TV shows for admin table
  app.get('/api/admin/tv-shows', requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string || '';
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT id, name, age_range, episode_length, creator, release_year, 
               is_featured, image_url, stimulation_score,
               has_omdb_data, has_youtube_data
        FROM catalog_tv_shows
      `;
      let countQuery = 'SELECT COUNT(*) as total FROM catalog_tv_shows';
      let queryParams: any[] = [];
      let countParams: any[] = [];
      
      if (search) {
        query += ' WHERE name ILIKE $1';
        countQuery += ' WHERE name ILIKE $1';
        queryParams = [`%${search}%`, limit, offset];
        countParams = [`%${search}%`];
      } else {
        queryParams = [limit, offset];
      }
      
      query += ' ORDER BY name ASC LIMIT $' + (search ? '2' : '1') + ' OFFSET $' + (search ? '3' : '2');
      
      const [showsResult, totalResult] = await Promise.all([
        pool.query(query, queryParams),
        pool.query(countQuery, countParams)
      ]);
      
      res.json({
        shows: showsResult.rows,
        total: parseInt(totalResult.rows[0]?.total || '0'),
        page,
        limit
      });
    } catch (error) {
      console.error('Admin TV shows error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update show featured status
  app.patch('/api/admin/tv-shows/:id/featured', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { isFeatured } = req.body;
      
      await pool.query(
        'UPDATE catalog_tv_shows SET is_featured = $1 WHERE id = $2',
        [isFeatured, id]
      );
      
      res.json({ message: 'Featured status updated' });
    } catch (error) {
      console.error('Update featured status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get single TV show for editing
  app.get('/api/admin/tv-shows/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await pool.query('SELECT * FROM catalog_tv_shows WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Show not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get TV show error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all unique themes from the database
  app.get('/api/admin/themes', requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT DISTINCT unnest(themes) as theme 
        FROM catalog_tv_shows 
        WHERE themes IS NOT NULL AND array_length(themes, 1) > 0
        ORDER BY theme ASC
      `);
      
      const themes = result.rows.map(row => row.theme).filter(theme => theme && theme.trim() !== '');
      res.json(themes);
    } catch (error) {
      console.error('Get themes error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update TV show
  app.put('/api/admin/tv-shows/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const {
        name, description, age_range, episode_length, creator, release_year,
        themes, stimulation_score, is_featured, image_url
      } = req.body;
      
      await pool.query(`
        UPDATE catalog_tv_shows SET 
          name = $1, description = $2, age_range = $3, episode_length = $4,
          creator = $5, release_year = $6, themes = $7, stimulation_score = $8,
          is_featured = $9, image_url = $10, updated_at = NOW()
        WHERE id = $11
      `, [name, description, age_range, episode_length, creator, release_year, 
          JSON.stringify(themes), stimulation_score, is_featured, image_url, id]);
      
      res.json({ message: 'Show updated successfully' });
    } catch (error) {
      console.error('Update TV show error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create new TV show
  app.post('/api/admin/tv-shows', requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        name, description, age_range, episode_length, creator, release_year,
        themes, stimulation_score, is_featured, image_url
      } = req.body;
      
      const result = await pool.query(`
        INSERT INTO catalog_tv_shows (
          name, description, age_range, episode_length, creator, release_year,
          themes, stimulation_score, is_featured, image_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id
      `, [name, description, age_range, episode_length, creator, release_year, 
          JSON.stringify(themes), stimulation_score, is_featured, image_url]);
      
      res.json({ 
        message: 'Show created successfully',
        id: result.rows[0].id 
      });
    } catch (error) {
      console.error('Create TV show error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete TV show
  app.delete('/api/admin/tv-shows/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await pool.query('DELETE FROM catalog_tv_shows WHERE id = $1', [id]);
      res.json({ message: 'Show deleted successfully' });
    } catch (error) {
      console.error('Delete TV show error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}