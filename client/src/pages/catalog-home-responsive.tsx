import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryRow from "@/components/CategoryRow";
import ShowCard from "@/components/ShowCard";
import { Search, Filter, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import AdContainer from "@/components/AdContainer";
import type { TvShow, HomepageCategory } from "../../../shared/catalog-schema";

export default function CatalogHomeResponsive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch homepage categories
  const { data: homepageCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/homepage-categories'],
    queryFn: async () => {
      const response = await fetch('/api/homepage-categories');
      if (!response.ok) throw new Error('Failed to fetch homepage categories');
      return response.json() as Promise<HomepageCategory[]>;
    },
  });

  // Fetch shows for each category
  const { data: categoryShows = {}, isLoading: categoryShowsLoading } = useQuery({
    queryKey: ['/api/homepage-category-shows', homepageCategories?.map(c => c.id)],
    queryFn: async () => {
      if (!homepageCategories?.length) return {};
      
      const categoryShows: { [key: number]: TvShow[] } = {};
      
      await Promise.all(
        homepageCategories.map(async (category: HomepageCategory) => {
          try {
            const response = await fetch(`/api/homepage-categories/${category.id}/shows`);
            if (response.ok) {
              categoryShows[category.id] = await response.json();
            }
          } catch (error) {
            console.error(`Failed to fetch shows for category ${category.id}:`, error);
            categoryShows[category.id] = [];
          }
        })
      );
      
      return categoryShows;
    },
    enabled: !!homepageCategories?.length,
  });

  // Fetch all shows for search functionality
  const { data: allShows = [], isLoading: showsLoading } = useQuery({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json() as Promise<TvShow[]>;
    },
  });

  const isLoading = categoriesLoading || categoryShowsLoading;
  
  // Filter shows based on search
  const filteredShows = searchTerm 
    ? allShows.filter(show => 
        show.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Sort categories by display order
  const sortedCategories = [...homepageCategories].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-white border-b">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Screen Time Stimulation Scores
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto">
              Find TV shows measured by stimulation levels, helping you discover content that fits your child's needs.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Enter show title"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-16 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-slate-700 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Container */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <AdContainer size="leaderboard" className="w-full max-w-4xl" />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              Search Results for "{searchTerm}" ({filteredShows.length} shows)
            </h2>
            {filteredShows.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredShows.slice(0, 20).map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No shows found matching your search.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Homepage Categories */}
      {!searchTerm && (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-12">
            {sortedCategories.map((category) => {
              const shows = categoryShows[category.id] || [];
              
              if (shows.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <div className="space-y-2">
                    {/* First row: Headline and show count badge */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {category.name}
                        <span className="text-sm font-normal bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                          {category.showCount || shows.length} shows
                        </span>
                      </h2>
                    </div>
                    {/* Second row: Description and View All button */}
                    <div className="flex items-center justify-between">
                      <p className="text-gray-600">{category.description}</p>
                      <Link href={`/browse?category=${category.id}`}>
                        <Button variant="outline">View All</Button>
                      </Link>
                    </div>
                  </div>
                  
                  <CategoryRow shows={shows} />
                </div>
              );
            })}

            {/* Fallback message if no categories */}
            {sortedCategories.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Categories Available</h2>
                <p className="text-gray-600 mb-6">
                  Homepage categories are being set up. Browse all shows in the meantime.
                </p>
                <Link href="/browse">
                  <Button size="lg">Browse All Shows</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Ad Container */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <AdContainer 
              size={isMobile ? "mobile-banner" : "leaderboard"} 
              className="w-full max-w-4xl" 
              label="Advertisement"
            />
          </div>
        </div>
      </div>
    </div>
  );
}