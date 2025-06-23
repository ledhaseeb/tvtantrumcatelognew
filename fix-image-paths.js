/**
 * Script to fix image paths in the database by mapping show names to actual image files
 */

import { pool } from './server/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all image files from custom-images directory
function getCustomImageFiles() {
  const imagesDir = path.join(__dirname, 'public', 'custom-images');
  const files = fs.readdirSync(imagesDir);
  return files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
}

// Create mapping between show names and image files
function createImageMapping(shows, imageFiles) {
  const mapping = {};
  
  for (const show of shows) {
    const showName = show.name.toLowerCase();
    
    // Try exact matches first
    let matchedFile = imageFiles.find(file => {
      const fileName = file.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '');
      return fileName === showName;
    });
    
    // Try partial matches
    if (!matchedFile) {
      matchedFile = imageFiles.find(file => {
        const fileName = file.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/i, '');
        const cleanShowName = showName.replace(/[^a-z0-9]/g, '');
        const cleanFileName = fileName.replace(/[^a-z0-9]/g, '');
        return cleanFileName.includes(cleanShowName) || cleanShowName.includes(cleanFileName);
      });
    }
    
    // Try more flexible matching
    if (!matchedFile) {
      const showWords = showName.split(/\s+/);
      matchedFile = imageFiles.find(file => {
        const fileName = file.toLowerCase();
        return showWords.every(word => word.length > 2 && fileName.includes(word));
      });
    }
    
    if (matchedFile) {
      mapping[show.id] = `/custom-images/${matchedFile}`;
      console.log(`✓ ${show.name} → ${matchedFile}`);
    } else {
      console.log(`✗ No image found for: ${show.name}`);
    }
  }
  
  return mapping;
}

async function fixImagePaths() {
  try {
    console.log('🔍 Getting all TV shows from database...');
    const result = await pool.query('SELECT id, name, image_url FROM catalog_tv_shows ORDER BY name');
    const shows = result.rows;
    
    console.log(`📺 Found ${shows.length} shows in database`);
    
    console.log('🖼️  Getting image files from custom-images directory...');
    const imageFiles = getCustomImageFiles();
    console.log(`📁 Found ${imageFiles.length} image files`);
    
    console.log('🔗 Mapping shows to images...');
    const mapping = createImageMapping(shows, imageFiles);
    
    console.log(`✅ Mapped ${Object.keys(mapping).length} shows to images`);
    
    // Update database with correct image paths
    let updateCount = 0;
    for (const [showId, imagePath] of Object.entries(mapping)) {
      await pool.query(
        'UPDATE catalog_tv_shows SET image_url = $1 WHERE id = $2',
        [imagePath, showId]
      );
      updateCount++;
    }
    
    console.log(`🎯 Updated ${updateCount} shows with correct image paths`);
    console.log('✨ Image path fixing completed!');
    
  } catch (error) {
    console.error('❌ Error fixing image paths:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
fixImagePaths();