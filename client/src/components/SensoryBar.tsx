interface SensoryBarProps {
  level: string | null | undefined;
  className?: string;
  height?: 'thin' | 'thick';
}

export default function SensoryBar({ level, className = "", height = 'thick' }: SensoryBarProps) {
  // Convert sensory level text to percentage
  const getSensoryLevelPercentage = (level: string | null | undefined) => {
    if (!level) return 60; // Default to moderate
    const normalizedLevel = level.toLowerCase().trim();
    
    switch (normalizedLevel) {
      case 'very low':
      case 'very-low':
      case 'low':
      case 'minimal':
      case 'limited':
        return 20;
      case 'low-moderate':
      case 'low moderate':
      case 'moderate-low':
        return 40;
      case 'moderate':
        return 60;
      case 'moderate-high':
      case 'moderate high':
      case 'mod-high':
        return 80;
      case 'high':
      case 'very high':
      case 'very-high':
        return 100;
      default:
        return 60; // Default to moderate if unknown
    }
  };

  const percentage = getSensoryLevelPercentage(level);
  const barHeight = height === 'thick' ? 'h-4' : 'h-2';

  return (
    <div className={`w-full bg-gray-200 rounded-full ${barHeight} relative overflow-hidden ${className}`}>
      {/* Custom gradient background using exact color scheme */}
      <div 
        className={`absolute inset-0 ${barHeight} rounded-full`}
        style={{
          background: 'linear-gradient(to right, #22c55e 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #dc2626 100%)'
        }}
      ></div>
      
      {/* Gray overlay to mask unused portion */}
      <div 
        className={`absolute top-0 right-0 bg-gray-200 ${barHeight} rounded-r-full transition-all duration-300`}
        style={{ width: `${100 - percentage}%` }}
      ></div>
      
      {/* Indicator line at current level */}
      <div 
        className={`absolute top-0 w-0.5 ${barHeight} bg-gray-800 transition-all duration-300`}
        style={{ left: `calc(${percentage}% - 1px)` }}
      ></div>
    </div>
  );
}