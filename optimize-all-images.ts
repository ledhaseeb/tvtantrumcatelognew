/**
 * Script to optimize all custom images in the database for better SEO
 * This resizes images to optimal dimensions and compresses them for faster loading
 */

import { db, pool } from './server/db';
import { eq, not, like } from 'drizzle-orm';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { tvShows } from './shared/schema';
import { updateCustomImageMap, loadCustomImageMap, saveCustomImageMap } from './server/image-preservator';

// Create upload directories if they don't exist
const imageDir = './public/uploads';
const optimizedImageDir = './public/uploads/optimized';

if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

if (!fs.existsSync(optimizedImageDir)) {
  fs.mkdirSync(optimizedImageDir, { recursive: true });
}

/**
 * Download an image from a URL or copy from local path
 */
async function downloadImage(imageUrl: string, showId: number): Promise<string | null> {
  try {
    // Skip if URL is null, OMDB image, or already optimized
    if (!imageUrl || 
        imageUrl.includes('m.media-amazon.com') || 
        imageUrl.includes('omdbapi.com') ||
        imageUrl.includes('/uploads/optimized/')) {
      console.log(`Skipping image for show ${showId}: OMDB image or already optimized`);
      return null;
    }
    
    // For local images with relative paths
    if (imageUrl.startsWith('/')) {
      // Try different possible locations for local images
      const possiblePaths = [
        path.join('.', 'public', imageUrl),
        path.join('.', 'public', 'custom-images', path.basename(imageUrl)),
        path.join('.', 'public', 'images', path.basename(imageUrl)),
        path.join('.', 'attached_assets', path.basename(imageUrl)),
        path.join('.', imageUrl) // Try direct path
      ];
      
      for (const localPath of possiblePaths) {
        if (fs.existsSync(localPath)) {
          console.log(`Found local image at ${localPath} for show ${showId}`);
          
          // Create a copy in the upload directory
          const timestamp = Date.now();
          const uniqueFilename = `show-${showId}-${timestamp}${path.extname(localPath) || '.jpg'}`;
          const tempFilePath = path.join(imageDir, uniqueFilename);
          
          fs.copyFileSync(localPath, tempFilePath);
          console.log(`Copied local image to: ${tempFilePath}`);
          return tempFilePath;
        }
      }
      
      console.log(`Could not find local image at any expected location: ${imageUrl}`);
      return null;
    }
    
    // For external URLs
    if (imageUrl.startsWith('http')) {
      console.log(`Downloading image for show ${showId} from: ${imageUrl}`);
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        console.error(`Failed to download image for show ${showId}: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const buffer = await response.buffer();
      const timestamp = Date.now();
      const uniqueFilename = `show-${showId}-${timestamp}.jpg`;
      const tempFilePath = path.join(imageDir, uniqueFilename);
      
      fs.writeFileSync(tempFilePath, buffer);
      console.log(`Downloaded image to: ${tempFilePath}`);
      return tempFilePath;
    }
    
    console.log(`Unsupported image URL format: ${imageUrl}`);
    return null;
    
  } catch (error) {
    console.error(`Error downloading image for show ${showId}:`, error);
    return null;
  }
}

/**
 * Optimize an image for web use
 */
async function optimizeImage(filePath: string, showId: number): Promise<string | null> {
  try {
    if (!filePath) return null;
    
    const filename = path.basename(filePath, path.extname(filePath));
    const optimizedFilename = `${filename}-optimized.jpg`;
    const optimizedPath = path.join(optimizedImageDir, optimizedFilename);
    
    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width || 800;
    const originalHeight = metadata.height || 600;
    
    // Target portrait format sizes
    let targetWidth: number;
    let targetHeight: number;
    
    if (originalHeight >= originalWidth) {
      // Already portrait or square
      targetWidth = Math.min(originalWidth, 600);
      targetHeight = Math.round((targetWidth / originalWidth) * originalHeight);
      
      // Limit very tall images
      if (targetHeight > 900) {
        targetHeight = 900;
        targetWidth = Math.round((targetHeight / originalHeight) * originalWidth);
      }
    } else {
      // Landscape - convert to portrait-friendly dimensions
      targetHeight = Math.min(originalHeight, 800);
      targetWidth = Math.min(originalWidth, Math.round(targetHeight * 0.75));
    }
    
    // Process with sharp
    await sharp(filePath)
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);
    
    console.log(`Image optimized: ${optimizedPath} (${targetWidth}x${targetHeight})`);
    
    // Return web path to optimized image
    return `/uploads/optimized/${optimizedFilename}`;
    
  } catch (error) {
    console.error(`Error optimizing image for show ${showId}:`, error);
    return null;
  }
}

/**
 * Main function to optimize all custom images
 */
async function optimizeAllCustomImages() {
  console.log('Starting image optimization process...');
  
  // Load custom image map
  const customImageMap = loadCustomImageMap();
  let optimizedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  try {
    // Get all shows with non-OMDB, non-optimized images
    const shows = await db.select().from(tvShows).where(
      not(like(tvShows.imageUrl, '%/uploads/optimized/%'))
    );
    
    const showsToProcess = shows.filter(show => 
      show.imageUrl && 
      !show.imageUrl.includes('m.media-amazon.com') && 
      !show.imageUrl.includes('omdbapi.com') &&
      !show.imageUrl.includes('/uploads/optimized/')
    );
    
    console.log(`Found ${showsToProcess.length} custom images to optimize out of ${shows.length} total shows`);
    
    // Process each show's image
    for (const show of showsToProcess) {
      try {
        console.log(`\nProcessing show: ${show.name} (ID: ${show.id})`);
        console.log(`Current image URL: ${show.imageUrl}`);
        
        // Download image
        const localPath = await downloadImage(show.imageUrl, show.id);
        if (!localPath) {
          console.log(`Skipping image optimization for show ID ${show.id}`);
          skippedCount++;
          continue;
        }
        
        // Optimize image
        const optimizedUrl = await optimizeImage(localPath || '', show.id);
        if (!optimizedUrl) {
          console.error(`Failed to optimize image for show ID ${show.id}`);
          errorCount++;
          continue;
        }
        
        // Make optimizedUrl non-null for TypeScript
        const safeOptimizedUrl = optimizedUrl;
        
        // Update database with safe non-null URL
        await db
          .update(tvShows)
          .set({ imageUrl: safeOptimizedUrl })
          .where(eq(tvShows.id, show.id));
        
        // Update custom image map
        updateCustomImageMap(show.id, safeOptimizedUrl);
        optimizedCount++;
        
        console.log(`Updated image for ${show.name}: ${optimizedUrl}`);
        
        // Clean up temporary file
        if (localPath.startsWith(imageDir)) {
          try {
            fs.unlinkSync(localPath);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        
      } catch (error) {
        console.error(`Error processing show ID ${show.id}:`, error);
        errorCount++;
      }
    }
    
    // Save updated custom image map
    saveCustomImageMap(customImageMap);
    
    console.log('\nOptimization complete:');
    console.log(`- Optimized: ${optimizedCount}`);
    console.log(`- Skipped: ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`- Total processed: ${showsToProcess.length}`);
    
  } catch (error) {
    console.error('Error during optimization process:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the optimization process
optimizeAllCustomImages().catch(console.error);