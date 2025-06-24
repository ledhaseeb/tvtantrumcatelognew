/**
 * Image Optimization Script
 * Converts JPG images to WebP format and creates multiple sizes
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_DIR = path.join(__dirname, '../client/public/images/tv-shows');
const OUTPUT_DIR = path.join(__dirname, '../client/public/images/optimized');

// Image size configurations
const SIZES = {
  thumbnail: { width: 200, height: 300 },
  medium: { width: 400, height: 600 },
  large: { width: 600, height: 900 }
};

async function ensureDirectory(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function optimizeImage(inputPath, filename) {
  const baseName = path.parse(filename).name;
  const outputBase = path.join(OUTPUT_DIR, baseName);
  
  try {
    // Load original image
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`Processing ${filename} (${metadata.width}x${metadata.height})`);
    
    // Generate different sizes in WebP format
    const promises = Object.entries(SIZES).map(async ([sizeName, dimensions]) => {
      const outputPath = `${outputBase}-${sizeName}.webp`;
      
      await image
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      return { size: sizeName, path: outputPath };
    });
    
    // Also create optimized original size
    const originalOptimized = `${outputBase}-original.webp`;
    await image
      .webp({ quality: 85 })
      .toFile(originalOptimized);
    
    const results = await Promise.all(promises);
    results.push({ size: 'original', path: originalOptimized });
    
    return { filename, results };
    
  } catch (error) {
    console.error(`Error processing ${filename}:`, error.message);
    return { filename, error: error.message };
  }
}

async function main() {
  console.log('Starting image optimization...');
  
  // Ensure output directory exists
  await ensureDirectory(OUTPUT_DIR);
  
  // Get all JPG files
  const files = await fs.readdir(INPUT_DIR);
  const jpgFiles = files.filter(file => 
    file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
  );
  
  console.log(`Found ${jpgFiles.length} images to optimize`);
  
  // Process images in batches of 5 to avoid memory issues
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < jpgFiles.length; i += batchSize) {
    const batch = jpgFiles.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(jpgFiles.length/batchSize)}`);
    
    const batchPromises = batch.map(filename => {
      const inputPath = path.join(INPUT_DIR, filename);
      return optimizeImage(inputPath, filename);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  const successful = results.filter(r => !r.error);
  const failed = results.filter(r => r.error);
  
  console.log('\n=== Optimization Complete ===');
  console.log(`Successfully optimized: ${successful.length} images`);
  console.log(`Failed: ${failed.length} images`);
  
  if (failed.length > 0) {
    console.log('\nFailed files:');
    failed.forEach(f => console.log(`- ${f.filename}: ${f.error}`));
  }
  
  // Calculate space savings
  const originalDir = await fs.readdir(INPUT_DIR);
  const optimizedDir = await fs.readdir(OUTPUT_DIR);
  
  console.log(`\nGenerated ${optimizedDir.length} optimized files from ${originalDir.length} originals`);
  console.log('Each image now has: thumbnail (200x300), medium (400x600), large (600x900), and original sizes');
}

main().catch(console.error);

export { optimizeImage, SIZES };