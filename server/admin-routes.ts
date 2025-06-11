import { Router } from 'express';
import { catalogStorage } from './catalog-storage';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin authentication middleware (temporarily disabled for testing)
const requireAdmin = (req: any, res: any, next: any) => {
  // Temporarily bypass admin check for testing
  next();
};

// Get admin stats
router.get('/stats', async (req, res) => {
  try {
    const shows = await catalogStorage.getTvShows();
    const totalShows = shows.length;
    const featuredShows = shows.filter(show => show.isFeatured).length;
    
    res.json({
      totalShows,
      featuredShows,
      adminUsers: 1,
      databaseStatus: 'connected'
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all shows with admin fields
router.get('/shows', async (req, res) => {
  try {
    const { search } = req.query;
    let shows = await catalogStorage.getTvShows();
    
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      shows = shows.filter(show => 
        show.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Map to admin table format
    const adminShows = shows.map(show => ({
      id: show.id,
      name: show.name,
      ageRange: show.ageRange,
      stimulationScore: show.stimulationScore,
      isFeatured: show.isFeatured || false,
      hasOmdbData: show.hasOmdbData || false,
      hasYoutubeData: show.hasYoutubeData || false
    }));
    
    res.json(adminShows);
  } catch (error) {
    console.error('Error fetching shows:', error);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Set featured show
router.put('/shows/:id/featured', async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    
    // First remove featured status from all shows
    const allShows = await catalogStorage.getTvShows();
    for (const show of allShows) {
      if (show.isFeatured) {
        await catalogStorage.updateTvShow(show.id, { isFeatured: false });
      }
    }
    
    // Set the new featured show
    await catalogStorage.updateTvShow(showId, { isFeatured: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting featured show:', error);
    res.status(500).json({ error: 'Failed to set featured show' });
  }
});

// Get single show for editing (legacy path)
router.get('/shows/:id', async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    const show = await catalogStorage.getTvShowById(showId);
    
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }
    
    res.json(show);
  } catch (error) {
    console.error('Error fetching show:', error);
    res.status(500).json({ error: 'Failed to fetch show' });
  }
});

// Get single TV show for editing (correct path for frontend)
router.get('/tv-shows/:id', async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    console.log(`[ADMIN] Fetching TV show ${showId} for editing`);
    
    const show = await catalogStorage.getTvShowById(showId);
    
    if (!show) {
      console.log(`[ADMIN] TV show ${showId} not found`);
      return res.status(404).json({ error: 'Show not found' });
    }
    
    console.log(`[ADMIN] Successfully fetched TV show ${showId}:`, show.name);
    res.json(show);
  } catch (error) {
    console.error('Error fetching TV show:', error);
    res.status(500).json({ error: 'Failed to fetch TV show' });
  }
});

// Create new show
router.post('/shows', upload.single('image'), async (req, res) => {
  try {
    const showData = { ...req.body };
    
    // Parse themes from JSON string if needed
    if (typeof showData.themes === 'string') {
      try {
        showData.themes = JSON.parse(showData.themes);
      } catch (e) {
        showData.themes = [];
      }
    }
    
    // Handle image upload
    if (req.file) {
      const imageUrl = await processImage(req.file, showData.name);
      showData.imageUrl = imageUrl;
    }
    
    // Convert string numbers to actual numbers
    if (showData.stimulationScore) {
      showData.stimulationScore = parseInt(showData.stimulationScore);
    }
    if (showData.episodeLength) {
      showData.episodeLength = parseInt(showData.episodeLength);
    }
    if (showData.seasons) {
      showData.seasons = parseInt(showData.seasons);
    }
    if (showData.releaseYear) {
      showData.releaseYear = parseInt(showData.releaseYear);
    }
    
    const newShow = await catalogStorage.createTvShow(showData);
    res.json(newShow);
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({ error: 'Failed to create show' });
  }
});

// Update existing show
router.put('/shows/:id', upload.single('image'), async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    const showData = { ...req.body };
    
    // Parse themes from JSON string if needed
    if (typeof showData.themes === 'string') {
      try {
        showData.themes = JSON.parse(showData.themes);
      } catch (e) {
        showData.themes = [];
      }
    }
    
    // Handle image upload
    if (req.file) {
      const imageUrl = await processImage(req.file, showData.name);
      showData.imageUrl = imageUrl;
    }
    
    // Convert string numbers to actual numbers
    if (showData.stimulationScore) {
      showData.stimulationScore = parseInt(showData.stimulationScore);
    }
    if (showData.episodeLength) {
      showData.episodeLength = parseInt(showData.episodeLength);
    }
    if (showData.seasons) {
      showData.seasons = parseInt(showData.seasons);
    }
    if (showData.releaseYear) {
      showData.releaseYear = parseInt(showData.releaseYear);
    }
    
    const updatedShow = await catalogStorage.updateTvShow(showId, showData);
    res.json(updatedShow);
  } catch (error) {
    console.error('Error updating show:', error);
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// Delete show
router.delete('/shows/:id', async (req, res) => {
  try {
    const showId = parseInt(req.params.id);
    await catalogStorage.deleteTvShow(showId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).json({ error: 'Failed to delete show' });
  }
});

// Get all unique themes from the database
router.get('/themes', async (req, res) => {
  try {
    const themes = await catalogStorage.getAllUniqueThemes();
    res.json(themes);
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to fetch themes' });
  }
});

// Process and optimize uploaded images
async function processImage(file: Express.Multer.File, showName: string): Promise<string> {
  try {
    // Ensure images directory exists
    const imagesDir = path.join(process.cwd(), 'client', 'public', 'images', 'tv-shows');
    await fs.mkdir(imagesDir, { recursive: true });
    
    // Create SEO-friendly filename
    const sanitizedName = showName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const fileName = `${sanitizedName}-${Date.now()}.jpg`;
    const filePath = path.join(imagesDir, fileName);
    
    // Optimize image to portrait format (3:4 ratio, 400x600px)
    await sharp(file.buffer)
      .resize(400, 600, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(filePath);
    
    return `/images/tv-shows/${fileName}`;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Research Management Routes

// Get all research summaries
router.get('/research', async (req, res) => {
  try {
    const research = await catalogStorage.getAllResearchSummaries();
    res.json(research);
  } catch (error) {
    console.error('Error fetching research:', error);
    res.status(500).json({ error: 'Failed to fetch research' });
  }
});

// Get single research summary
router.get('/research/:id', async (req, res) => {
  try {
    const researchId = parseInt(req.params.id);
    const research = await catalogStorage.getResearchSummaryById(researchId);
    if (!research) {
      return res.status(404).json({ error: 'Research not found' });
    }
    res.json(research);
  } catch (error) {
    console.error('Error fetching research:', error);
    res.status(500).json({ error: 'Failed to fetch research' });
  }
});

// Create new research summary
router.post('/research', async (req, res) => {
  try {
    const researchData = req.body;
    
    // Validate required fields
    if (!researchData.title || !researchData.category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const newResearch = await catalogStorage.createResearchSummary(researchData);
    res.status(201).json(newResearch);
  } catch (error) {
    console.error('Error creating research:', error);
    res.status(500).json({ error: 'Failed to create research' });
  }
});

// Update research summary
router.put('/research/:id', async (req, res) => {
  try {
    const researchId = parseInt(req.params.id);
    const researchData = req.body;
    
    const updatedResearch = await catalogStorage.updateResearchSummary(researchId, researchData);
    if (!updatedResearch) {
      return res.status(404).json({ error: 'Research not found' });
    }
    
    res.json(updatedResearch);
  } catch (error) {
    console.error('Error updating research:', error);
    res.status(500).json({ error: 'Failed to update research' });
  }
});

// Delete research summary
router.delete('/research/:id', requireAdmin, async (req, res) => {
  try {
    const researchId = parseInt(req.params.id);
    const deleted = await catalogStorage.deleteResearchSummary(researchId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Research not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting research:', error);
    res.status(500).json({ error: 'Failed to delete research' });
  }
});

// Homepage Categories Management Routes

// Get all homepage categories (admin view with inactive categories)
router.get('/homepage-categories', async (req, res) => {
  try {
    const categories = await catalogStorage.getAllHomepageCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching homepage categories:', error);
    res.status(500).json({ error: 'Failed to fetch homepage categories' });
  }
});

// Create new homepage category
router.post('/homepage-categories', async (req, res) => {
  try {
    const categoryData = req.body;
    
    // Validate required fields
    if (!categoryData.name || !categoryData.filterConfig) {
      return res.status(400).json({ error: 'Name and filter configuration are required' });
    }
    
    const newCategory = await catalogStorage.createHomepageCategory(categoryData);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating homepage category:', error);
    res.status(500).json({ error: 'Failed to create homepage category' });
  }
});

// Update homepage category
router.put('/homepage-categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const categoryData = req.body;
    
    const updatedCategory = await catalogStorage.updateHomepageCategory(categoryId, categoryData);
    if (!updatedCategory) {
      return res.status(404).json({ error: 'Homepage category not found' });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating homepage category:', error);
    res.status(500).json({ error: 'Failed to update homepage category' });
  }
});

// Delete homepage category
router.delete('/homepage-categories/:id', async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const deleted = await catalogStorage.deleteHomepageCategory(categoryId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Homepage category not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting homepage category:', error);
    res.status(500).json({ error: 'Failed to delete homepage category' });
  }
});

export default router;