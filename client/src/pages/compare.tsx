import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import AdContainer from "@/components/AdContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStimulationScoreColor } from "@/lib/showUtils";
import RatingBar from "@/components/RatingBar";
import SensoryBar from "@/components/SensoryBar";
import { TvShow } from "@shared/schema";

export default function Compare() {
  const [_, setLocation] = useLocation();
  const [selectedShowIds, setSelectedShowIds] = useState<number[]>([]);
  const [showToAdd, setShowToAdd] = useState<string>("");

  // Fetch all TV shows for the selector directly from tv_shows database
  const { data: allShows, isLoading: loadingShows } = useQuery<TvShow[]>({
    queryKey: ['/api/tv-shows'],
    queryFn: async () => {
      const response = await fetch('/api/tv-shows');
      if (!response.ok) throw new Error('Failed to fetch shows');
      return response.json();
    },
    staleTime: 300000, // 5 minutes cache
  });

  // Fetch details for selected shows
  const { data: selectedShows, isLoading: loadingSelected } = useQuery<TvShow[]>({
    queryKey: ['/api/tv-shows'],
    enabled: selectedShowIds.length > 0,
    select: (data) => {
      if (!data) return [];
      return data.filter(show => selectedShowIds.includes(show.id));
    }
  });

  const handleBackClick = () => {
    setLocation("/");
  };

  const handleRemoveShow = (id: number) => {
    setSelectedShowIds(prev => prev.filter(showId => showId !== id));
  };

  // Update to immediately add show when selected from dropdown
  const handleAddShow = (value: string) => {
    if (value && !selectedShowIds.includes(Number(value))) {
      setSelectedShowIds(prev => [...prev, Number(value)]);
      setShowToAdd("");
    }
  };

  // Load comparison data from localStorage on component mount
  useEffect(() => {
    const savedComparison = localStorage.getItem('tvShowComparison');
    if (savedComparison) {
      try {
        const parsed = JSON.parse(savedComparison);
        if (Array.isArray(parsed)) {
          setSelectedShowIds(parsed);
        }
      } catch (e) {
        console.error("Error parsing saved comparison data", e);
      }
    }
  }, []);

  // Save comparison to localStorage when it changes
  useEffect(() => {
    if (selectedShowIds.length > 0) {
      localStorage.setItem('tvShowComparison', JSON.stringify(selectedShowIds));
    }
  }, [selectedShowIds]);

  const isLoading = loadingShows || loadingSelected;

  // Get available shows that aren't already in the comparison
  const availableShows = allShows?.filter(
    show => !selectedShowIds.includes(show.id)
  );

  // Helper function to get level percentage for bar charts
  const getLevelPercentage = (level: string) => {
    switch(level) {
      case 'Low': return 20;
      case 'Limited': return 20;
      case 'Minimal': return 20;
      case 'Moderate-Low': return 40;
      case 'Moderate': return 60;
      case 'Moderate-High': return 80;
      case 'High': return 100;
      default: return 60;
    }
  };
  
  // Helper function to determine rating level based on text
  const getRatingLevel = (rating: string | null | undefined): number => {
    if (!rating) return 3; // Default to moderate
    
    if (rating.includes('Low-Moderate') || rating.includes('Low to Moderate')) {
      return 2;
    } else if (rating.includes('Moderate-Low')) {
      return 2;
    } else if (rating.includes('Moderate-High') || rating.includes('Moderate to High')) {
      return 4;
    } else if (rating.includes('Mod-High')) {
      return 4;
    } else if (rating === 'Low') {
      return 1;
    } else if (rating === 'Moderate') {
      return 3;
    } else if (rating === 'High') {
      return 5;
    } else if (rating === 'Limited') {
      return 1;
    } else if (rating === 'Minimal') {
      return 1;
    }
    
    return 3; // Default to moderate
  };
  


  // Helper function to get stimulation score dots
  const getStimulationScoreDots = (score: number) => {
    return (
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
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-4 text-primary" onClick={handleBackClick}>
            <i className="fas fa-arrow-left mr-2"></i> Back
          </Button>
          <h2 className="text-2xl font-heading font-bold">Compare Shows</h2>
        </div>
      </div>

      {/* Compare Page Ad */}
      <div className="mb-6">
        <AdContainer size="leaderboard" className="mx-auto" />
      </div>
      
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <div>
          {/* Show selector area in portrait format */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => {
              const show = selectedShows && selectedShows[index];
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">Show {index + 1}</p>
                    {show ? (
                      <>
                        <div className="relative mb-2">
                          {(show as any).image_url ? (
                            <img
                              src={(show as any).image_url}
                              alt={`${show.name} TV show cover`}
                              className="w-24 h-36 object-cover rounded-lg"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-24 h-36 bg-gray-200 rounded-lg flex items-center justify-center">
                              <i className="fas fa-tv text-gray-400 text-xl"></i>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveShow(show.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                          >
                            <i className="fas fa-times text-xs"></i>
                          </button>
                        </div>
                        <p className="font-medium text-center text-sm">{show.name}</p>
                      </>
                    ) : (
                      <div className="w-full">
                        <Select
                          value={showToAdd}
                          onValueChange={(value) => handleAddShow(value)}
                        >
                          <SelectTrigger className="bg-white text-sm">
                            <SelectValue placeholder="Select a show" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableShows && availableShows.length > 0 ? (
                              availableShows.map(show => (
                                <SelectItem key={show.id} value={String(show.id)}>
                                  {show.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-shows" disabled>
                                No more shows available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedShows && selectedShows.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
              <h3 className="text-xl font-bold mb-6">Compare Shows</h3>
              
              {/* Comparison table with mobile-friendly layout */}
              <div className="mb-8">
                {/* Show names at the top of columns */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {selectedShows.map(show => (
                    <div key={`name-${show.id}`} className="font-medium text-center text-lg">
                      {show.name}
                    </div>
                  ))}
                  {selectedShows.length < 3 && (
                    Array(3 - selectedShows.length).fill(0).map((_, i) => (
                      <div key={`empty-name-${i}`} className="font-medium text-center text-lg text-gray-400">-</div>
                    ))
                  )}
                </div>
                
                {/* Target Age */}
                <div className="mb-6">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Target Age
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`age-${show.id}`} className="text-center py-2">
                        {(show as any).age_range || 'Unknown'}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-age-${i}`} className="text-center py-2 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Animation Style */}
                <div className="mb-6">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Animation Style
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`style-${show.id}`} className="text-center py-2">
                        {(show as any).animation_style || 'Traditional Animation'}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-style-${i}`} className="text-center py-2 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Themes */}
                <div className="mb-6">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Themes
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`themes-${show.id}`} className="flex flex-wrap justify-center gap-1 py-2">
                        {show.themes && show.themes.map((theme, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 text-xs font-medium">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-themes-${i}`} className="text-center py-2 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stimulation Score Comparison using dots */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Stimulation Score Comparison</h3>
                <div className="mb-2">
                  <div className="font-medium text-center py-1 border-b border-gray-200">
                    Stimulation Score
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {selectedShows.map(show => (
                    <div key={`stim-${show.id}`} className="flex flex-col items-center">
                      <div className="flex flex-col items-center py-2">
                        {getStimulationScoreDots((show as any).stimulation_score || 3)}
                        <div className="text-center text-sm font-medium">
                          {(show as any).stimulation_score || 3}/5
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedShows.length < 3 && (
                    Array(3 - selectedShows.length).fill(0).map((_, i) => (
                      <div key={`empty-stim-${i}`} className="flex flex-col">
                        <div className="text-center py-2 text-gray-400">-</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Sensory Metrics with Bar Charts - Side by side layout */}
              <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Sensory Metrics Comparison</h3>
                
                {/* Show names at the top of columns */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {selectedShows.map(show => (
                    <div key={`name-${show.id}`} className="font-medium text-center text-lg">
                      {show.name}
                    </div>
                  ))}
                  {selectedShows.length < 3 && (
                    Array(3 - selectedShows.length).fill(0).map((_, i) => (
                      <div key={`empty-name-${i}`} className="font-medium text-center text-lg text-gray-400">-</div>
                    ))
                  )}
                </div>
                
                {/* Interactivity Level */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Interaction Level
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`interaction-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).interactivity_level || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-interaction-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`interaction-bar-${show.id}`}>
                        <SensoryBar level={(show as any).interactivity_level} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-interaction-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Dialogue Intensity */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Dialogue Intensity
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`dialogue-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).dialogue_intensity || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-dialogue-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`dialogue-bar-${show.id}`}>
                        <SensoryBar level={(show as any).dialogue_intensity} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-dialogue-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Sound Effects Level */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Sound Effects Level
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`sound-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).sound_effects_level || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-sound-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`sound-bar-${show.id}`}>
                        <SensoryBar level={(show as any).sound_effects_level} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-sound-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Scene Frequency */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Scene Frequency
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`scene-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).scene_frequency || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-scene-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`scene-bar-${show.id}`}>
                        <SensoryBar level={(show as any).scene_frequency} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-scene-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Music Tempo */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Music Tempo
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`tempo-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).music_tempo || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-tempo-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`tempo-bar-${show.id}`}>
                        <SensoryBar level={(show as any).music_tempo} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-tempo-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Total Music Level */}
                <div className="mb-8">
                  <div className="mb-2">
                    <div className="font-medium text-center py-1 border-b border-gray-200">
                      Total Music Level
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-1">
                    {selectedShows.map(show => (
                      <div key={`music-${show.id}`} className="text-center py-1">
                        <span className="text-sm font-medium">{(show as any).total_music_level || 'Moderate'}</span>
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-music-${i}`} className="text-center py-1 text-gray-400">-</div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedShows.map(show => (
                      <div key={`music-bar-${show.id}`}>
                        <SensoryBar level={(show as any).total_music_level} />
                      </div>
                    ))}
                    {selectedShows.length < 3 && (
                      Array(3 - selectedShows.length).fill(0).map((_, i) => (
                        <div key={`empty-music-bar-${i}`} className="h-4"></div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-xl shadow-md">
              <div className="mb-4 text-gray-400">
                <i className="fas fa-tv text-6xl"></i>
              </div>
              <h3 className="text-lg font-medium mb-2">No Shows Selected</h3>
              <p className="text-gray-500 mb-4">Select shows from the dropdown menus above to compare them.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Bottom Compare Ad */}
      <div className="mt-12 mb-6">
        <AdContainer size="rectangle" className="mx-auto" />
      </div>
    </main>
  );
}