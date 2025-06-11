import { TvShow } from "@shared/schema";

/**
 * Returns a color class based on the stimulation score value
 * Lower stimulation score is better for calmness
 */
export function getStimulationScoreColor(value: number): string {
  if (value <= 2) return "green-rating";
  if (value <= 4) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a color class based on overall rating
 */
export function getPositiveRatingColor(value: number): string {
  if (value >= 4) return "purple-rating";
  if (value >= 3) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a text description for the stimulation score
 */
export function getStimulationScoreDescription(value: number): string {
  if (value === 1) {
    return "Low stimulation - calming content with gentle pacing.";
  } else if (value === 2) {
    return "Low-Medium stimulation - mostly calm content with occasional moderate energy.";
  } else if (value === 3) {
    return "Medium stimulation - balanced content with moderate energy.";
  } else if (value === 4) {
    return "Medium-High stimulation - moderately energetic content with some intense moments.";
  } else {
    return "High stimulation - energetic content that may be overstimulating for some children.";
  }
}

/**
 * Returns a description for interactivity level
 */
export function getInteractivityLevelDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal audience interaction, children mostly observe passively.";
    case "Moderate-Low":
      return "Some audience engagement, primarily through questions or simple responses.";
    case "Moderate":
      return "Balanced audience engagement with regular interaction throughout the show.";
    case "Moderate-High":
      return "Frequent audience engagement with multiple interactive elements.";
    case "High":
      return "Very interactive format that encourages active participation throughout.";
    default:
      return "Moderate level of interactivity.";
  }
}

/**
 * Returns a description for dialogue intensity
 */
export function getDialogueIntensityDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal dialogue, relies more on visuals and music.";
    case "Moderate-Low":
      return "Simple dialogue with plenty of pauses and visual storytelling.";
    case "Moderate":
      return "Balanced dialogue that's appropriate for the target age group.";
    case "Moderate-High":
      return "Conversation-heavy with more complex language patterns.";
    case "High":
      return "Very dialogue-rich content with complex vocabulary or frequent conversations.";
    default:
      return "Moderate level of dialogue.";
  }
}

/**
 * Returns a description for sound effects level
 */
export function getSoundEffectsLevelDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal sound effects, creating a calm viewing experience.";
    case "Moderate-Low":
      return "Gentle sound effects that enhance the content without overwhelming.";
    case "Moderate":
      return "Balanced use of sound effects to support the storytelling.";
    case "Moderate-High":
      return "Frequent sound effects that play a significant role in the experience.";
    case "High":
      return "Sound effect-heavy show with prominent audio elements throughout.";
    default:
      return "Moderate level of sound effects.";
  }
}

/**
 * Generate a default placeholder image URL for a show
 */
export function getDefaultShowImage(showName: string): string {
  // This function would typically return a real image URL
  // But since we can't use images, returning empty string
  return "";
}

/**
 * Filter shows based on provided filters
 */
export function filterShows(
  shows: TvShow[],
  filters: {
    ageGroup?: string;
    tantrumFactor?: string;
    search?: string;
    themes?: string[];
    interactionLevel?: string;
    stimulationScoreRange?: {min: number, max: number};
  }
): TvShow[] {
  return shows.filter(show => {
    // Filter by age group
    if (filters.ageGroup && show.ageRange) {
      if (filters.ageGroup === 'Toddler' && !show.ageRange.match(/^[0-3]|toddler/i)) {
        return false;
      }
      if (filters.ageGroup === 'Preschool' && !show.ageRange.match(/^[2-5]|preschool/i)) {
        return false;
      }
      if (filters.ageGroup === 'School-Age' && !show.ageRange.match(/^[5-9]|school/i)) {
        return false;
      }
      if (filters.ageGroup === 'Tween' && !show.ageRange.match(/^[8-9]|10-1[2-3]|tween/i)) {
        return false;
      }
    }
    
    // Filter by tantrum factor (stimulation score)
    if (filters.tantrumFactor) {
      if (filters.tantrumFactor.toLowerCase() === 'low' && show.stimulationScore !== 1) {
        return false;
      }
      if (filters.tantrumFactor.toLowerCase() === 'low-medium' && show.stimulationScore !== 2) {
        return false;
      }
      if (filters.tantrumFactor.toLowerCase() === 'medium' && show.stimulationScore !== 3) {
        return false;
      }
      if (filters.tantrumFactor.toLowerCase() === 'medium-high' && show.stimulationScore !== 4) {
        return false;
      }
      if (filters.tantrumFactor.toLowerCase() === 'high' && show.stimulationScore !== 5) {
        return false;
      }
    }
    
    // Filter by themes
    if (filters.themes && filters.themes.length > 0) {
      if (!show.themes || show.themes.length === 0) {
        return false;
      }
      
      // Check if ALL selected themes are present in the show's themes
      const showThemesLower = show.themes.map(t => t.toLowerCase());
      if (!filters.themes.every(theme => showThemesLower.some(t => t.includes(theme.toLowerCase())))) {
        return false;
      }
    }
    
    // Filter by interactivity level
    if (filters.interactionLevel && show.interactivityLevel) {
      // Handle exact match or level-based match
      if (filters.interactionLevel === 'Low' && 
          !['Low', 'Limited', 'Minimal'].some(term => show.interactivityLevel?.includes(term))) {
        return false;
      }
      if (filters.interactionLevel === 'Moderate' && 
          !['Moderate', 'Medium', 'Some'].some(term => show.interactivityLevel?.includes(term))) {
        return false;
      }
      if (filters.interactionLevel === 'High' && 
          !['High', 'Heavy', 'Strong', 'Frequent'].some(term => show.interactivityLevel?.includes(term))) {
        return false;
      }
    }
    

    
    // Filter by stimulation score range
    if (filters.stimulationScoreRange && show.stimulationScore) {
      if (show.stimulationScore < filters.stimulationScoreRange.min || 
          show.stimulationScore > filters.stimulationScoreRange.max) {
        return false;
      }
    }
    
    // Search by show name or description
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim().toLowerCase();
      const showName = show.name.toLowerCase();
      const showDescription = (show.description || '').toLowerCase();

      // Check for exact match first - highest priority
      if (showName === searchTerm) {
        return true;
      }
      
      // Direct match in name or description
      if (showName.includes(searchTerm) || showDescription.includes(searchTerm)) {
        return true;
      }
      
      // Handle shows with year ranges (e.g., "Show Name 2018-present")
      const nameWithoutYears = showName.replace(/\s+\d{4}(-\d{4}|-present)?/g, '');
      if (nameWithoutYears.includes(searchTerm)) {
        return true;
      }
      
      // Match any part of a word (for show names like "Blue's Clues")
      const words = showName.split(/\s+/);
      if (words.some(word => word.includes(searchTerm))) {
        return true;
      }
      
      // Handle apostrophes and special characters
      const simplifiedName = showName.replace(/[''\.]/g, '');
      if (simplifiedName.includes(searchTerm)) {
        return true;
      }
      
      // Check themes for matches
      if (show.themes && show.themes.some(theme => theme.toLowerCase().includes(searchTerm))) {
        return true;
      }
      
      // If no match found, exclude this show
      return false;
    }
    
    return true;
  });
}

/**
 * Sort shows based on provided sort option
 */
export function sortShows(
  shows: TvShow[],
  sortBy?: string
): TvShow[] {
  if (!sortBy) return shows;
  
  return [...shows].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'stimulation-score':
        return a.stimulationScore - b.stimulationScore; // Lower is better
      case 'interactivity-level':
        // Sort by interactivity level - Low, Moderate, High
        const levelMap: {[key: string]: number} = {
          'Low': 1,
          'Moderate-Low': 2,
          'Moderate': 3,
          'Moderate-High': 4,
          'High': 5
        };
        const aLevel = levelMap[a.interactivityLevel || 'Moderate'] || 3;
        const bLevel = levelMap[b.interactivityLevel || 'Moderate'] || 3;
        return aLevel - bLevel;
      case 'popular':
        // Popular would be handled by a separate API endpoint, so this is a fallback
        // The views+searches metrics impact popularity
        const aPopularity = ((a as any).views || 0) * 2 + ((a as any).searches || 0);
        const bPopularity = ((b as any).views || 0) * 2 + ((b as any).searches || 0);
        return bPopularity - aPopularity; // Higher popularity first
      case 'overall-rating':
        return b.overallRating - a.overallRating;
      default:
        return 0;
    }
  });
}
