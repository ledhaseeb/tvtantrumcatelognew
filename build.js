#!/usr/bin/env node

import { build } from 'vite';
import esbuild from 'esbuild';

async function buildApp() {
  try {
    console.log('Building frontend...');
    await build();
    
    console.log('Building backend...');
    await esbuild.build({
      entryPoints: ['server/index.ts'],
      platform: 'node',
      format: 'esm',
      bundle: true,
      outdir: 'dist',
      external: [
        '@neondatabase/serverless',
        'ws',
        'pg-native',
        'sharp'
      ],
      packages: 'external'
    });
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildApp();