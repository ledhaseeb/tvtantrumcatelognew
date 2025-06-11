# TV Show Catalog - Children's Media Discovery Platform

A gamified web platform revolutionizing children's media discovery through an intelligent, socially-driven content recommendation system. Features 302 authentic TV shows with advanced filtering and search capabilities.

## Features

- **Comprehensive TV Show Database**: 302 authentic children's TV shows
- **Advanced Filtering**: Age range, themes, stimulation scores, sensory preferences
- **Smart Search**: Multi-criteria search with theme matching
- **Performance Optimized**: Caching system for high-traffic scenarios
- **Mobile Responsive**: Works perfectly on all devices
- **Health Monitoring**: Built-in health checks and performance metrics

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js 20
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Node-cache for performance optimization
- **Deployment**: Railway-ready with Docker support

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Deployment

### Railway Deployment (Recommended)
1. Connect this repository to Railway
2. Set environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SESSION_SECRET` - Secure random string
   - `NODE_ENV=production`
3. Deploy automatically with included `railway.json` configuration

### Environment Variables
See `.env.example` for complete list of required environment variables.

## API Endpoints

- `GET /api/tv-shows` - Get TV shows with filtering
- `GET /api/tv-shows/:id` - Get single TV show
- `GET /api/themes` - Get all available themes
- `GET /api/search` - Search shows
- `GET /api/health` - Health check endpoint

## Database Schema

Complete PostgreSQL schema with:
- TV shows with comprehensive metadata
- Themes and platform relationships
- Homepage categories for content organization
- User session management

## Performance Features

- Aggressive caching for viral traffic handling
- CDN-ready with proper cache headers
- Request queuing for high concurrent loads
- Performance monitoring endpoints

## License

MIT License