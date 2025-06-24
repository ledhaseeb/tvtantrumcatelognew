# TV Tantrum - Children's Media Discovery Platform

## Overview

TV Tantrum is a gamified web platform that revolutionizes children's media discovery through an intelligent, sensory-aware content recommendation system. The application features a comprehensive database of 302 authentic TV shows with detailed metadata including stimulation scores, sensory information, and age-appropriate filtering capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for fast development and optimized production builds
- **Component Library**: Radix UI for accessible, headless components
- **State Management**: TanStack Query for server state management
- **Routing**: React Router with dynamic routing for shows and categories

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with tsx for direct execution
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express-session with PostgreSQL store for production
- **Caching**: Multi-tier caching system (Node-cache + enhanced in-memory cache)
- **File Upload**: Multer with disk storage for admin media uploads

### Database Design
- **Primary Database**: PostgreSQL with connection pooling
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Comprehensive TV show metadata with sensory information
- **Caching Strategy**: Aggressive caching for viral traffic handling

## Key Components

### Core Entities
1. **TV Shows**: Complete metadata including stimulation scores, themes, sensory details
2. **Homepage Categories**: Admin-curated collections with dynamic filtering
3. **Research Summaries**: Child development research content
4. **Admin System**: Simple authentication and content management

### Frontend Components
- **App-catalog.tsx**: Main application router (active entry point)
- **CatalogNavbar**: Primary navigation component
- **ShowCard**: Reusable TV show display component
- **SensoryBar**: Visual representation of stimulation levels
- **catalog-home-responsive.tsx**: Mobile-first homepage
- **catalog-show-detail-page-fixed.tsx**: Individual show details page

### Backend Services
- **catalog-storage.ts**: Primary data access layer with caching
- **cache.ts**: Multi-tier caching system for viral traffic
- **simple-admin.ts**: Streamlined admin authentication
- **enhanced-cache.ts**: Advanced caching for search and homepage data

## Data Flow

### User Journey
1. **Homepage Load**: Cached homepage categories and featured shows
2. **Browse/Filter**: Real-time filtering with cached results
3. **Show Details**: Detailed view with related show recommendations
4. **Search**: Intelligent search across names, descriptions, and themes

### Admin Flow
1. **Authentication**: Simple session-based admin login
2. **Content Management**: Add/edit shows and homepage categories
3. **Image Upload**: Direct file upload with optimization
4. **Cache Management**: Automatic cache invalidation on updates

### Caching Strategy
- **L1 Cache**: In-memory for frequently accessed data (Node-cache)
- **L2 Cache**: Enhanced search and homepage caching
- **TTL Configuration**: Optimized for viral traffic patterns
- **Cache Invalidation**: Smart invalidation based on content updates

## External Dependencies

### Production Services
- **Database**: PostgreSQL (Neon DB or Railway PostgreSQL)
- **Image Storage**: Local file system with CDN-ready structure
- **Analytics**: Google Analytics 4 integration
- **Monetization**: Google AdSense with GDPR compliance

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Drizzle Kit**: Database schema management and migrations

### Key Libraries
- **UI Components**: Radix UI ecosystem for accessibility
- **Data Fetching**: TanStack Query for robust server state
- **File Processing**: Sharp for image optimization
- **Compression**: gzip compression for production performance

## Deployment Strategy

### Production Environment
- **Platform**: Railway (primary) with Render as backup
- **Entry Point**: `npx tsx server/index.ts` for direct TypeScript execution
- **Environment**: Node.js 20 with PostgreSQL 16
- **Health Checks**: Built-in `/api/health` endpoint

### Database Strategy
- **Connection Pooling**: Optimized for high-traffic scenarios (50 max connections)
- **Session Storage**: PostgreSQL-backed sessions for scalability
- **Error Recovery**: Graceful database disconnection handling
- **Migration Strategy**: Drizzle migrations with rollback capability

### Performance Optimizations
- **Caching**: Multi-tier caching system designed for viral traffic
- **Compression**: gzip compression with optimized settings
- **Request Queuing**: Protection against traffic spikes
- **Connection Management**: Optimized database connection pooling

### Scaling Considerations
- **Cache-First Architecture**: Reduces database load during traffic spikes
- **Stateless Design**: Session data in database for horizontal scaling
- **CDN-Ready**: Static assets organized for CDN deployment
- **Health Monitoring**: Comprehensive health checks and error reporting

## Changelog

Changelog:
- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.