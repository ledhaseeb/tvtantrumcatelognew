import { Express, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Set up multer storage with disk storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './public/research';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${safeName}`);
  }
});

// Create multer instance with disk storage
const uploadMiddleware = multer({ 
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function setupUploadRoutes(app: Express) {
  // Simple file upload endpoint
  app.post('/api/upload', uploadMiddleware.single('file'), (req, res) => {
    try {
      console.log('File upload request received');
      
      if (!req.file) {
        console.log('No file in the request');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return the URL to the uploaded file
      const fileUrl = `/research/${req.file.filename}`;
      console.log(`File uploaded successfully: ${fileUrl}`);
      
      return res.json({ url: fileUrl });
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }
  });
}