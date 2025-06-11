import express, { Express, Request, Response } from "express";
import { catalogStorage } from "./catalog-storage";
import { insertTvShowSchema } from "@shared/catalog-schema";
import bcrypt from "bcrypt";
import session from "express-session";
import { setupAdminSession, setupAdminAuth, requireAdmin } from "./admin-auth";

const router = express.Router();

export { router };

export function registerCatalogRoutes(app: Express) {
  // Setup admin session and authentication
  setupAdminSession(app);
  setupAdminAuth(app);

  // Health check
  router.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Get all TV shows with filtering
  router.get("/tv-shows", async (req: Request, res: Response) => {
    try {
      const filters: any = {};
      
      // Parse query parameters
      if (req.query.search) filters.search = req.query.search;
      if (req.query.ageGroup) filters.ageGroup = req.query.ageGroup;
      if (req.query.ageRange) filters.ageGroup = req.query.ageRange; // Map ageRange to ageGroup for compatibility
      if (req.query.sortBy) filters.sortBy = req.query.sortBy;
      if (req.query.themeMatchMode) filters.themeMatchMode = req.query.themeMatchMode;
      
      // Handle themes
      if (req.query.themes) {
        filters.themes = typeof req.query.themes === 'string'
          ? req.query.themes.split(',').map((theme: string) => theme.trim())
          : (req.query.themes as string[]).map((theme: string) => theme.trim());
      }
      
      // Handle stimulation score range
      if (req.query.stimulationScoreRange) {
        try {
          filters.stimulationScoreRange = typeof req.query.stimulationScoreRange === 'string'
            ? JSON.parse(req.query.stimulationScoreRange as string)
            : req.query.stimulationScoreRange;
        } catch (error) {
          console.error('Error parsing stimulationScoreRange:', error);
        }
      }
      
      // Handle pagination
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);
      if (req.query.offset) filters.offset = parseInt(req.query.offset as string);
      
      const shows = await catalogStorage.getTvShows(filters);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching TV shows:", error);
      res.status(500).json({ message: "Failed to fetch TV shows" });
    }
  });

  // Get single TV show by ID
  app.get("/api/tv-shows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const show = await catalogStorage.getTvShowById(id);
      
      if (!show) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching TV show:", error);
      res.status(500).json({ message: "Failed to fetch TV show" });
    }
  });

  // Get featured show
  app.get("/api/shows/featured", async (req: Request, res: Response) => {
    try {
      const show = await catalogStorage.getFeaturedShow();
      
      if (!show) {
        return res.status(404).json({ message: "No featured show found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching featured show:", error);
      res.status(500).json({ message: "Failed to fetch featured show" });
    }
  });

  // Get popular shows
  app.get("/api/shows/popular", async (req: Request, res: Response) => {
    try {
      const limitStr = req.query.limit;
      const limit = limitStr && typeof limitStr === 'string' ? parseInt(limitStr) : 10;
      
      const shows = await catalogStorage.getPopularShows(limit);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching popular shows:", error);
      res.status(500).json({ message: "Failed to fetch popular shows" });
    }
  });

  // Search shows
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({ message: "Search term required" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const shows = await catalogStorage.searchShows(searchTerm, limit);
      res.json(shows);
    } catch (error) {
      console.error("Error searching shows:", error);
      res.status(500).json({ message: "Failed to search shows" });
    }
  });

  // Get themes
  app.get("/api/themes", async (req: Request, res: Response) => {
    try {
      const themes = await catalogStorage.getThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ message: "Failed to fetch themes" });
    }
  });

  // Get platforms
  app.get("/api/platforms", async (req: Request, res: Response) => {
    try {
      const platforms = await catalogStorage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching platforms:", error);
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // Get individual TV show by ID
  app.get("/api/tv-shows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const show = await catalogStorage.getTvShowById(id);
      
      if (!show) {
        return res.status(404).json({ message: "TV show not found" });
      }
      
      res.json(show);
    } catch (error) {
      console.error("Error fetching TV show:", error);
      res.status(500).json({ message: "Failed to fetch TV show" });
    }
  });

  // Get similar shows based on themes and age range
  app.get("/api/tv-shows/similar/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid show ID" });
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const similarShows = await catalogStorage.getSimilarShows(id, limit);
      
      res.json(similarShows);
    } catch (error) {
      console.error("Error fetching similar shows:", error);
      res.status(500).json({ message: "Failed to fetch similar shows" });
    }
  });

  // Get research summaries
  app.get("/api/research", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      const research = await catalogStorage.getResearchSummaries(category, limit);
      res.json(research);
    } catch (error) {
      console.error("Error fetching research summaries:", error);
      res.status(500).json({ message: "Failed to fetch research summaries" });
    }
  });

  // Get single research summary
  app.get("/api/research/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const research = await catalogStorage.getResearchSummaryById(id);
      
      if (!research) {
        return res.status(404).json({ message: "Research summary not found" });
      }
      
      res.json(research);
    } catch (error) {
      console.error("Error fetching research summary:", error);
      res.status(500).json({ message: "Failed to fetch research summary" });
    }
  });

  // Admin authentication routes
  app.post("/api/auth/admin-login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      // Simple password check for admin access
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      if (password === adminPassword) {
        (req.session as any).isAdmin = true;
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Invalid password" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/admin-check", (req: Request, res: Response) => {
    if ((req.session as any)?.isAdmin) {
      res.json({ isAdmin: true });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Admin-only routes (protected)
  function requireAdmin(req: Request, res: Response, next: any) {
    if (!(req.session as any)?.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  }

  // Admin: Create TV show
  app.post("/api/admin/tv-shows", requireAdmin, async (req: Request, res: Response) => {
    try {
      const showData = insertTvShowSchema.parse(req.body);
      // Ensure all required fields have proper defaults
      const normalizedData = {
        ...showData,
        creator: showData.creator || null,
        releaseYear: showData.releaseYear || null,
        endYear: showData.endYear || null,
        isOngoing: showData.isOngoing ?? true,
        seasons: showData.seasons || null,
        creativityRating: showData.creativityRating || null,
        availableOn: showData.availableOn || [],
        themes: showData.themes || [],
        animationStyle: showData.animationStyle || null,
        imageUrl: showData.imageUrl || null,
        isFeatured: showData.isFeatured ?? false,
        subscriberCount: showData.subscriberCount || null,
        videoCount: showData.videoCount || null,
        channelId: showData.channelId || null,
        isYouTubeChannel: showData.isYouTubeChannel ?? false,
        publishedAt: showData.publishedAt || null,
        hasOmdbData: showData.hasOmdbData ?? false,
        hasYoutubeData: showData.hasYoutubeData ?? false,
      };
      const newShow = await catalogStorage.createTvShow(normalizedData);
      res.status(201).json(newShow);
    } catch (error) {
      console.error("Error creating TV show:", error);
      res.status(500).json({ message: "Failed to create TV show" });
    }
  });

  // Admin: Update TV show
  app.put("/api/admin/tv-shows/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedShow = await catalogStorage.updateTvShow(id, updates);
      
      if (!updatedShow) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      res.json(updatedShow);
    } catch (error) {
      console.error("Error updating TV show:", error);
      res.status(500).json({ message: "Failed to update TV show" });
    }
  });

  // Admin: Delete TV show
  app.delete("/api/admin/tv-shows/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await catalogStorage.deleteTvShow(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Show not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting TV show:", error);
      res.status(500).json({ message: "Failed to delete TV show" });
    }
  });

  // Note: Admin TV show routes are handled by admin-routes.ts

  // Homepage Categories Management Routes
  
  // Get all homepage categories (public)
  app.get("/api/homepage-categories", async (req: Request, res: Response) => {
    try {
      const categories = await catalogStorage.getHomepageCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching homepage categories:", error);
      res.status(500).json({ message: "Failed to fetch homepage categories" });
    }
  });

  // Get shows for a specific category (public)
  app.get("/api/homepage-categories/:id/shows", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.id);
      const shows = await catalogStorage.getShowsForCategory(categoryId);
      res.json(shows);
    } catch (error) {
      console.error("Error fetching category shows:", error);
      res.status(500).json({ message: "Failed to fetch category shows" });
    }
  });

  // Admin: Get all homepage categories (including inactive)
  app.get("/api/admin/homepage-categories", async (req: Request, res: Response) => {
    try {
      const categories = await catalogStorage.getAllHomepageCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin homepage categories:", error);
      res.status(500).json({ message: "Failed to fetch homepage categories" });
    }
  });

  // Admin: Create homepage category
  app.post("/api/admin/homepage-categories", async (req: Request, res: Response) => {
    try {
      const category = await catalogStorage.createHomepageCategory(req.body);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating homepage category:", error);
      res.status(500).json({ message: "Failed to create homepage category" });
    }
  });

  // Admin: Update homepage category
  app.put("/api/admin/homepage-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[SERVER] Updating category ${id} with data:`, req.body);
      
      const category = await catalogStorage.updateHomepageCategory(id, req.body);
      
      if (!category) {
        console.log(`[SERVER] Category ${id} not found`);
        return res.status(404).json({ message: "Category not found" });
      }
      
      console.log(`[SERVER] Successfully updated category ${id}:`, category);
      res.json(category);
    } catch (error) {
      console.error("Error updating homepage category:", error);
      res.status(500).json({ message: "Failed to update homepage category" });
    }
  });

  // Admin: Delete homepage category
  app.delete("/api/admin/homepage-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await catalogStorage.deleteHomepageCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting homepage category:", error);
      res.status(500).json({ message: "Failed to delete homepage category" });
    }
  });
}