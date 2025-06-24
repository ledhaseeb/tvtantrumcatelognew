// Create a mapping of actual filenames to show IDs for special character handling
import { promises as fs } from 'fs';

async function createFilenameMapping() {
  const imageDir = './client/public/images/tv-shows';
  const files = await fs.readdir(imageDir);
  
  const mapping = {};
  
  files.forEach(file => {
    const match = file.match(/show-(\d+)-(.+)\.jpg$/);
    if (match) {
      const showId = parseInt(match[1]);
      const filename = match[2]; // The actual filename part
      mapping[showId] = filename;
    }
  });
  
  console.log('Filename mapping for problematic shows:');
  [58, 82, 99, 154, 199, 279, 295].forEach(id => {
    if (mapping[id]) {
      console.log(`Show ${id}: ${mapping[id]}`);
    }
  });
  
  return mapping;
}

createFilenameMapping().catch(console.error);