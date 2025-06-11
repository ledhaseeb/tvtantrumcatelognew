import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import ShowFilters from "@/components/ShowFilters";
import ShowCard from "@/components/ShowCard";
import SimpleShowCard from "@/components/SimpleShowCard";
import AdContainer from "@/components/AdContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { TvShow } from "@shared/schema";

export default function Browse() {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const [isMobile, setIsMobile] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null); // Ref for the results section
  const [activeFilters, setActiveFilters] = useState<{
    ageGroup?: string;
    ageRange?: {min: number, max: number};
    tantrumFactor?: string;
    sortBy?: string;
    search?: string;
    themes?: string[];
    themeMatchMode?: 'AND' | 'OR';
    interactionLevel?: string;
    dialogueIntensity?: string;
    soundFrequency?: string;
    stimulationScoreRange?: {min: number, max: number};
  }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const showsPerPage = 12;

  // Parse URL search params to set initial filters
  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const initialFilters: typeof activeFilters = {};
    
    // Get search query from URL
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      initialFilters.search = searchQuery;
    }
    
    // Get age group from URL (legacy support)
    const ageGroup = searchParams.get('ageGroup');
    if (ageGroup) {
      initialFilters.ageGroup = ageGroup;
    }
    
    // Get age range from URL - handle both JSON format and individual min/max params
    try {
      // First try to read individual min/max parameters
      const minAge = searchParams.get('ageRange.min') || searchParams.get('ageRangeMin');
      const maxAge = searchParams.get('ageRange.max') || searchParams.get('ageRangeMax');
      
      if (minAge && maxAge) {
        initialFilters.ageRange = {
          min: parseInt(minAge, 10),
          max: parseInt(maxAge, 10)
        };
        console.log('Parsed age range from individual params:', initialFilters.ageRange);
      } else {
        // Fall back to JSON format
        const ageRange = searchParams.get('ageRange');
        if (ageRange) {
          const parsedRange = JSON.parse(decodeURIComponent(ageRange));
          if (parsedRange && typeof parsedRange === 'object' && 'min' in parsedRange && 'max' in parsedRange) {
            initialFilters.ageRange = parsedRange;
            console.log('Parsed age range from JSON:', parsedRange);
          }
        }
      }
    } catch (e) {
      console.error('Error parsing age range:', e);
    }
    
    // Get themes from URL
    const themes = searchParams.get('themes');
    if (themes) {
      initialFilters.themes = themes.split(',');
    }
    
    // Get theme match mode from URL (AND or OR)
    const themeMatchMode = searchParams.get('themeMatchMode');
    if (themeMatchMode && (themeMatchMode === 'AND' || themeMatchMode === 'OR')) {
      initialFilters.themeMatchMode = themeMatchMode;
    }
    
    // Get sort option from URL
    const sortBy = searchParams.get('sortBy');
    if (sortBy) {
      initialFilters.sortBy = sortBy;
    }
    
    // Get tantrumFactor from URL
    const tantrumFactor = searchParams.get('tantrumFactor');
    if (tantrumFactor) {
      initialFilters.tantrumFactor = tantrumFactor;
    }
    
    // Get interactivity level from URL
    const interactionLevel = searchParams.get('interactionLevel');
    if (interactionLevel) {
      initialFilters.interactionLevel = interactionLevel;
    }
    
    // Also check for interactivityLevel (for consistency)
    const interactivityLevel = searchParams.get('interactivityLevel');
    if (interactivityLevel) {
      initialFilters.interactionLevel = interactivityLevel;
    }
    
    // Get dialogue intensity from URL
    const dialogueIntensity = searchParams.get('dialogueIntensity');
    if (dialogueIntensity) {
      initialFilters.dialogueIntensity = dialogueIntensity;
    }
    
    // Get sound frequency from URL
    const soundFrequency = searchParams.get('soundFrequency');
    if (soundFrequency) {
      initialFilters.soundFrequency = soundFrequency;
    }
    
    // Get stimulation score range from URL
    const stimulationScoreRange = searchParams.get('stimulationScoreRange');
    if (stimulationScoreRange) {
      try {
        const parsedRange = JSON.parse(decodeURIComponent(stimulationScoreRange));
        if (parsedRange && typeof parsedRange === 'object' && 'min' in parsedRange && 'max' in parsedRange) {
          initialFilters.stimulationScoreRange = parsedRange;
          console.log('Parsed stimulation score range:', parsedRange);
        }
      } catch (e) {
        console.error('Error parsing stimulation score range:', e);
      }
    }
    
    // Apply filters from URL immediately if any exist
    if (Object.keys(initialFilters).length > 0) {
      console.log('BROWSE PAGE: Auto-applying filters from URL:', initialFilters);
      setActiveFilters(initialFilters);
    } else {
      // If no URL filters, ensure we still trigger a fetch for default view
      setActiveFilters({});
    }
    // Mark filters as initialized so fetch can proceed
    setFiltersInitialized(true);
  }, [search]);

  // Use direct fetch instead of React Query to avoid timestamp issues
  const [shows, setShows] = useState<TvShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filtersInitialized, setFiltersInitialized] = useState(false);
  
  // Direct fetch implementation for maximum reliability
  useEffect(() => {
    // Don't fetch until URL filters have been parsed
    if (!filtersInitialized) return;
    async function fetchShows() {
      setIsLoading(true);
      setError(null);
      try {
        console.log('BROWSE PAGE: Fetching TV shows with filters:', activeFilters);
        
        // Build query string for API request
        const params = new URLSearchParams();
        
        // Add simple string filters
        if (activeFilters.search) params.append('search', activeFilters.search);
        if (activeFilters.ageGroup) params.append('ageGroup', activeFilters.ageGroup);
        if (activeFilters.tantrumFactor) params.append('tantrumFactor', activeFilters.tantrumFactor);
        if (activeFilters.sortBy) params.append('sortBy', activeFilters.sortBy);
        if (activeFilters.interactionLevel) params.append('interactionLevel', activeFilters.interactionLevel);
        if (activeFilters.dialogueIntensity) params.append('dialogueIntensity', activeFilters.dialogueIntensity);
        if (activeFilters.soundFrequency) params.append('soundFrequency', activeFilters.soundFrequency);
        
        // Add arrays as comma-separated strings
        if (activeFilters.themes && activeFilters.themes.length > 0) {
          params.append('themes', activeFilters.themes.join(','));
        }
        
        // Add match mode for themes
        if (activeFilters.themeMatchMode) {
          params.append('themeMatchMode', activeFilters.themeMatchMode);
        }
        
        // Add stimulation score range as JSON string
        if (activeFilters.stimulationScoreRange) {
          params.append('stimulationScoreRange', JSON.stringify(activeFilters.stimulationScoreRange));
        }
        
        // Add age range as JSON string
        if (activeFilters.ageRange) {
          params.append('ageRange', JSON.stringify(activeFilters.ageRange));
        }
        
        // Use fetch directly
        const response = await fetch(`/api/tv-shows?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`API error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('BROWSE PAGE: Received', data.length, 'shows');
        console.log('BROWSE PAGE: First show data:', data[0]);
        setShows(data);
      } catch (err) {
        console.error('BROWSE PAGE: Error fetching shows:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch shows'));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchShows();
  }, [activeFilters, filtersInitialized]);
  
  // Handler for navigating to show details
  const handleShowClick = (id: number) => {
    // Scroll to top first, then navigate
    window.scrollTo(0, 0);
    setLocation(`/shows/${id}`);
  };
  
  // Log the results separately
  useEffect(() => {
    if (shows) {
      console.log('Query success! Number of shows received:', shows.length);
      if (shows.length > 0) {
        console.log('First few shows:', shows.slice(0, 3).map(show => show.name));
      }
    }
    
    if (error) {
      console.error('Query error:', error);
    }
  }, [shows, error]);
  
  // Effect to detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 640; // sm breakpoint in Tailwind
      console.log('Window width:', window.innerWidth, 'isMobile:', isMobileView);
      setIsMobile(isMobileView);
    };
    
    // Check initially
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFilterChange = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // Update URL with new filters
    const searchParams = new URLSearchParams();
    if (filters.search) searchParams.set('search', filters.search);
    
    // Handle age filters - use individual parameters for better compatibility
    if (filters.ageRange) {
      searchParams.set('ageRangeMin', filters.ageRange.min.toString());
      searchParams.set('ageRangeMax', filters.ageRange.max.toString());
    } else if (filters.ageGroup) {
      // Legacy support for ageGroup parameter
      searchParams.set('ageGroup', filters.ageGroup);
    }
    
    if (filters.themes && filters.themes.length > 0) {
      searchParams.set('themes', filters.themes.join(','));
      // Also pass the theme match mode (AND/OR) if provided
      if (filters.themeMatchMode) searchParams.set('themeMatchMode', filters.themeMatchMode);
    }
    if (filters.sortBy) searchParams.set('sortBy', filters.sortBy);
    if (filters.tantrumFactor) searchParams.set('tantrumFactor', filters.tantrumFactor);
    if (filters.interactionLevel) searchParams.set('interactionLevel', filters.interactionLevel);
    if (filters.dialogueIntensity) searchParams.set('dialogueIntensity', filters.dialogueIntensity);
    if (filters.soundFrequency) searchParams.set('soundFrequency', filters.soundFrequency);
    if (filters.stimulationScoreRange) searchParams.set('stimulationScoreRange', 
        encodeURIComponent(JSON.stringify(filters.stimulationScoreRange)));
    
    const newSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
    setLocation(`/browse${newSearch}`);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
    setLocation('/browse');
  };

  // Calculate pagination
  const indexOfLastShow = currentPage * showsPerPage;
  const indexOfFirstShow = indexOfLastShow - showsPerPage;
  const currentShows = shows ? shows.slice(indexOfFirstShow, indexOfLastShow) : [];
  const totalPages = shows ? Math.ceil(shows.length / showsPerPage) : 0;
  const totalShows = shows?.length || 0;

  // Debug current shows data
  console.log('BROWSE PAGE: Current shows for display:', currentShows.length);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Scroll to the results section instead of the top of the page
    if (resultsRef.current) {
      // Adding a small offset to position just above the results
      const yOffset = -20; 
      const y = resultsRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          onClick={() => handlePageChange(1)} 
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            onClick={() => handlePageChange(i)} 
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there are multiple pages
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)} 
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <h1 className="text-2xl font-heading font-bold text-primary-800 mb-4">
          Browse Shows
        </h1>
        {/* Results count - only show on desktop */}
        <p className="text-gray-600 mb-6 hidden md:block">
          Showing {indexOfFirstShow + 1}-{Math.min(indexOfLastShow, totalShows)} of {totalShows} results
        </p>

        {/* Top Browse Ad */}
        <div className="mb-6">
          <AdContainer size="leaderboard" className="mx-auto" />
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column - Filters */}
          <div className="md:w-1/4">
            <ShowFilters 
              activeFilters={activeFilters} 
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>
          
          {/* Mobile Results Count - shown below filters on mobile */}
          <div className="md:hidden">
            <p className="text-gray-600 text-sm mb-4">
              Showing {indexOfFirstShow + 1}-{Math.min(indexOfLastShow, totalShows)} of {totalShows} results
            </p>
          </div>
          
          {/* Right Column - Show Grid */}
          <div className="md:w-3/4">
            {isLoading ? (
              // Loading skeleton grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>Error loading TV shows. Please try again later.</p>
              </div>
            ) : shows?.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                <p>No TV shows found matching your filters. Try adjusting your criteria.</p>
                {Object.keys(activeFilters).length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div ref={resultsRef}>
                {/* Show Cards Grid - Mobile uses portrait, desktop uses landscape */}
                {isMobile ? (
                  <div className="grid grid-cols-3 gap-3">
                    {/* Mobile grid layout with portrait cards */}
                    {currentShows.map(show => (
                      <ShowCard 
                        key={show.id} 
                        show={show} 
                        viewMode="grid"
                        isMobile={true}
                        onClick={() => handleShowClick(show.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentShows.map((show, index) => (
                      <ShowCard 
                        key={show.id} 
                        show={show} 
                        viewMode="grid"
                        onClick={() => handleShowClick(show.id)}
                      />
                    ))}
                  </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {renderPaginationItems()}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom Browse Ad */}
        <div className="mt-12 mb-6">
          <AdContainer 
            size={isMobile ? "mobile-banner" : "leaderboard"} 
            className="mx-auto" 
            label="Advertisement"
          />
        </div>
      </div>
    </div>
  );
}
