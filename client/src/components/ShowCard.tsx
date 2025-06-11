import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TvShow } from "@shared/schema";
import { TvShowCardImage } from "@/components/ui/tv-show-image";
import { Link } from "wouter";
import { memo } from "react";
import { scrollToTop } from "../lib/scroll-utils";

interface ShowCardProps {
  show: TvShow;
  viewMode: "grid" | "list";
  onClick: () => void;
  isMobile?: boolean;
}

// Memoized component for better performance under high traffic
function ShowCard({ show, viewMode, onClick, isMobile = false }: ShowCardProps) {
  // Ensure we have valid show data
  if (!show || !show.id) {
    return null;
  }

  // Handle click with scroll to top
  const handleShowClick = () => {
    scrollToTop('smooth');
    if (onClick) onClick();
  };
  
  // Normalize show data to handle API response field naming differences
  const normalizedShow = {
    ...show,
    // Handle both camelCase and snake_case field naming from database
    imageUrl: show.imageUrl || (show as any).image_url,
    ageRange: show.ageRange || (show as any).age_range || 'Unknown',
    stimulationScore: show.stimulationScore || (show as any).stimulation_score || 0
  };
  
  // Format release year range
  const releaseYears = show.releaseYear ? (
    show.endYear && show.endYear !== show.releaseYear 
      ? `(${show.releaseYear}-${show.endYear})` 
      : `(${show.releaseYear})`
  ) : '';
  
  // Theme colors based on categories
  const getThemeColor = (theme: string) => {
    const lowerTheme = theme.toLowerCase();
    if (lowerTheme.includes('friendship')) return 'bg-cyan-100 text-cyan-800';
    if (lowerTheme.includes('family')) return 'bg-green-100 text-green-800';
    if (lowerTheme.includes('adventure')) return 'bg-orange-100 text-orange-800';
    if (lowerTheme.includes('music')) return 'bg-purple-100 text-purple-800';
    if (lowerTheme.includes('science')) return 'bg-blue-100 text-blue-800';
    if (lowerTheme.includes('art')) return 'bg-pink-100 text-pink-800';
    if (lowerTheme.includes('problem')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  // Get stimulation text based on exact requirements
  const getStimulationText = (score: number) => {
    switch (score) {
      case 1: return 'Low';
      case 2: return 'Low-Mid';
      case 3: return 'Medium';
      case 4: return 'Mid-High';
      case 5: return 'High';
      default: return 'Unknown';
    }
  };

  // Get stimulation progress bar percentage (20%, 40%, 60%, 80%, 100%)
  const getStimulationPercentage = (score: number) => {
    return Math.min(score * 20, 100);
  };

  // Get stimulation progress bar color using custom colors from image
  const getStimulationBarColor = (score: number) => {
    switch (score) {
      case 1: return '#22c55e'; // Green
      case 2: return '#84cc16'; // Light green  
      case 3: return '#eab308'; // Yellow
      case 4: return '#f97316'; // Orange
      case 5: return '#dc2626'; // Red
      default: return '#9ca3af'; // Gray
    }
  };

  // Render stimulation indicator with dot-based design
  const renderStimulationIndicator = () => {
    const stimulationText = getStimulationText(normalizedShow.stimulationScore);
    const score = normalizedShow.stimulationScore || 3;
    
    return (
      <div className="w-full">
        {/* Show label only on non-mobile */}
        {!isMobile && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-800">Stimulation Level</span>
          </div>
        )}
        
        {/* Stimulation Score Dots */}
        <div className="flex justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((dot) => {
            let bgColor = '';
            if (dot === 1) bgColor = 'bg-green-500';
            else if (dot === 2) bgColor = 'bg-green-400';
            else if (dot === 3) bgColor = 'bg-yellow-500';
            else if (dot === 4) bgColor = 'bg-orange-500';
            else bgColor = 'bg-red-500';
            
            return (
              <div 
                key={dot} 
                className={`w-3 h-3 rounded-full ${dot <= score ? bgColor : 'border border-gray-300'}`}
              />
            );
          })}
        </div>
        
        <div className="text-sm font-semibold text-center">
          {stimulationText}
        </div>
      </div>
    );
  };

  // Mobile portrait style card - optimized sizing to prevent image cropping
  if (isMobile && viewMode === "grid") {
    
    return (
      <Link href={`/show/${show.id}`} onClick={handleShowClick}>
        <Card className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer flex flex-col hover:shadow-md transition-shadow h-72">
          {/* Image with reduced height to better fit poster aspect ratio */}
          <div className="relative h-40 overflow-hidden">
            <TvShowCardImage
              showId={show.id}
              showName={show.name}
              originalUrl={normalizedShow.imageUrl}
              className="w-full h-full object-cover"
              isInteractive={false}
            />
          </div>
          
          <CardContent className="p-3 flex flex-col flex-grow h-28">
            {/* Title with ellipsis */}
            <h3 className="text-sm font-bold line-clamp-1 mb-2">{show.name}</h3>
            
            {/* Age Text - no badge background */}
            <div className="text-gray-600 text-xs mb-2 w-fit">
              Ages {normalizedShow.ageRange}
            </div>
            
            {/* Enhanced Stimulation Indicator - at bottom */}
            <div className="mt-auto">
              {renderStimulationIndicator()}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // List view card
  if (viewMode === "list") {
    return (
      <Link href={`/show/${show.id}`} onClick={handleShowClick}>
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Show image */}
              <div className="flex-shrink-0">
                <TvShowCardImage
                  showId={show.id}
                  showName={show.name}
                  originalUrl={normalizedShow.imageUrl}
                  className="w-full sm:w-24 h-32 sm:h-36"
                  isInteractive={false}
                />
              </div>
              
              {/* Show details */}
              <div className="flex-grow min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{show.name}</h3>
                  <div className="flex items-center gap-2">
                    {/* Age badge */}
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                      Ages {normalizedShow.ageRange}
                    </Badge>
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  {show.description}
                </p>
                
                {/* Themes */}
                {show.themes && show.themes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {show.themes.slice(0, 4).map((theme, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-xs ${getThemeColor(theme)}`}
                      >
                        {theme}
                      </Badge>
                    ))}
                    {show.themes.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{show.themes.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {/* Enhanced Stimulation Indicator - at bottom */}
                <div className="mt-auto">
                  {renderStimulationIndicator()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Default grid view card
  return (
    <Link href={`/show/${show.id}`} onClick={handleShowClick}>
      <Card className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md transition-shadow">
        {/* Image */}
        <div className="relative">
          <TvShowCardImage
            showId={show.id}
            showName={show.name}
            originalUrl={normalizedShow.imageUrl}
            className="w-full aspect-[2/3]"
            isInteractive={false}
          />
        </div>
        
        <CardContent className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="text-sm font-bold mb-2 line-clamp-2">{show.name}</h3>
          
          {/* Target Ages */}
          <div className="mb-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs border-green-100">
              Ages {normalizedShow.ageRange}
            </Badge>
          </div>
          
          {/* Themes */}
          {show.themes && show.themes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {show.themes.slice(0, 2).map((theme, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className={`text-xs ${getThemeColor(theme)}`}
                >
                  {theme}
                </Badge>
              ))}
              {show.themes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{show.themes.length - 2}
                </Badge>
              )}
            </div>
          )}
          
          {/* Enhanced Stimulation Indicator - at bottom */}
          <div className="mt-auto">
            {renderStimulationIndicator()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default memo(ShowCard);