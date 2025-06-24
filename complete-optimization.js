import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const INPUT_DIR = './client/public/images/tv-shows';
const OUTPUT_DIR = './client/public/images/optimized';

const SIZES = {
  thumbnail: { width: 200, height: 300 },
  medium: { width: 400, height: 600 },
  large: { width: 600, height: 900 }
};

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const inputFiles = await fs.readdir(INPUT_DIR);
  const jpgFiles = inputFiles.filter(f => f.toLowerCase().endsWith('.jpg'));
  
  const outputFiles = await fs.readdir(OUTPUT_DIR).catch(() => []);
  const processedIds = new Set(
    outputFiles
      .filter(f => f.includes('-medium.webp'))
      .map(f => f.match(/show-(\d+)-/)?.[1])
      .filter(Boolean)
      .map(Number)
  );
  
  const remaining = jpgFiles.filter(file => {
    const id = file.match(/show-(\d+)-/)?.[1];
    return id && !processedIds.has(Number(id));
  });
  
  console.log(`Processing ${remaining.length} remaining images...`);
  
  for (let i = 0; i < remaining.length; i++) {
    const filename = remaining[i];
    const baseName = path.parse(filename).name;
    const inputPath = path.join(INPUT_DIR, filename);
    
    try {
      const image = sharp(inputPath);
      
      await Promise.all([
        ...Object.entries(SIZES).map(([sizeName, dims]) =>
          image.clone()
            .resize(dims.width, dims.height, { fit: 'cover' })
            .webp({ quality: 85 })
            .toFile(path.join(OUTPUT_DIR, `${baseName}-${sizeName}.webp`))
        ),
        image.clone()
          .webp({ quality: 85 })
          .toFile(path.join(OUTPUT_DIR, `${baseName}-original.webp`))
      ]);
      
      console.log(`✓ ${filename} (${i + 1}/${remaining.length})`);
    } catch (error) {
      console.log(`✗ ${filename}: ${error.message}`);
    }
  }
  
  const final = await fs.readdir(OUTPUT_DIR);
  const totalWebP = final.filter(f => f.endsWith('.webp')).length;
  console.log(`\nOptimization complete: ${totalWebP} WebP files generated`);
}

main().catch(console.error);