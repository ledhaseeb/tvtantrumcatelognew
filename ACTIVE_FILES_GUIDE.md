# TV Tantrum - Active Files Guide

## ⚠️ CRITICAL: Which Files Are Actually Used

This guide prevents confusion about which files are actively used in the application vs legacy/backup files.

## Application Entry Points

### Main Application
- **Entry File**: `client/src/main.tsx`
- **Root App Component**: `client/src/App-catalog.tsx` (NOT `client/src/App.tsx`)
- **Server**: `server/index.ts`

## Active Page Components

### Show Detail Page
- **ACTIVE FILE**: `client/src/pages/catalog-show-detail-page-fixed.tsx`
- **Route**: `/show/:id` in `App-catalog.tsx`
- ❌ **INACTIVE**: `client/src/pages/catalog-show-detail-page.tsx` (legacy file)

### Homepage
- **ACTIVE FILE**: `client/src/pages/catalog-home-responsive.tsx`
- **Route**: `/` in `App-catalog.tsx`

### Other Active Pages
- Browse: `client/src/pages/browse.tsx`
- Compare: `client/src/pages/compare.tsx`
- About: `client/src/pages/about.tsx`
- Research: `client/src/pages/research.tsx`
- Research Detail: `client/src/pages/research-detail.tsx`
- Admin: `client/src/pages/admin-page.tsx`

## Key Components

### Navigation
- **ACTIVE**: `client/src/components/CatalogNavbar.tsx`

### Show Cards
- **ACTIVE**: `client/src/components/ShowCard.tsx`

### Sensory Bars
- **ACTIVE**: `client/src/components/SensoryBar.tsx`

## Database & Storage
- **Database Config**: `server/db.ts`
- **Storage Layer**: `server/catalog-storage.ts`
- **Schema**: `shared/catalog-schema.ts`

## Quick Verification Steps

When making changes to show detail pages:

1. **Check the routing in `App-catalog.tsx`** - Line 43: `<Route path="/show/:id" component={CatalogShowDetailPage} />`
2. **Verify the import** - Line 12: `import CatalogShowDetailPage from "@/pages/catalog-show-detail-page-fixed";`
3. **Confirm in main.tsx** - Line 2: `import CatalogApp from "./App-catalog";`

## Legacy Files (DO NOT EDIT)
- `client/src/App.tsx` - Not used
- `client/src/pages/catalog-show-detail-page.tsx` - Superseded by `-fixed` version
- Any files with `.backup` or `.bak` extensions

## File Naming Convention
- Active files use descriptive names
- Legacy files often have version suffixes or are in backup folders
- When in doubt, trace the import chain from `main.tsx` → `App-catalog.tsx` → component

---

**Last Updated**: 2025-06-09
**Purpose**: Prevent wasting time editing inactive files