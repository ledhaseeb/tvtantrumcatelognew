import { TvShow } from "@shared/schema";
import ShowCard from "@/components/ShowCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface CategoryRowProps {
  title: string;
  description: string;
  shows: TvShow[];
  viewAllLink?: string;
}

export default function CategoryRow({ title, description, shows, viewAllLink }: CategoryRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  if (shows.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Category Header */}
      <div className="flex items-center justify-between mb-3 px-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {viewAllLink && (
          <Button variant="ghost" className="text-sm text-blue-600 hover:text-blue-800">
            View All →
          </Button>
        )}
      </div>

      {/* Scrollable Show Cards */}
      <div className="relative">
        {/* Left scroll button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-sm rounded-full w-8 h-8 p-0"
          onClick={scrollLeft}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Right scroll button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow-sm rounded-full w-8 h-8 p-0"
          onClick={scrollRight}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Horizontal scrolling container */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {shows.slice(0, 12).map((show) => (
            <ShowCard 
              key={show.id} 
              show={show} 
              viewMode="grid"
              onClick={() => {}}
              isMobile={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}