import { useState, useEffect } from "react";
import { X, Tv, Film, Globe } from "lucide-react";

const BANNER_DISMISSED_KEY = "kidsafetv-banner-v3";

export default function AnnouncementBanner() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem(BANNER_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <a
      href="https://kidsafetv.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-900 text-white relative hover:bg-slate-800/90 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col items-center justify-center gap-3 pr-8 text-center">
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
              Safer streaming is finally here! Get <span className="text-emerald-400">KidSafeTV</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto">
              Watch recommended content, instantly create playlists and enjoy wind-down protocols that avoid TV tantrums.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-cyan-500/20 rounded-md flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base font-bold leading-tight">95+</p>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">Shows</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-amber-500/20 rounded-md flex items-center justify-center">
                <Film className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base font-bold leading-tight">3,600+</p>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">Episodes</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-emerald-500/20 rounded-md flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="text-sm sm:text-base font-bold leading-tight">Worldwide</p>
                <p className="text-[10px] sm:text-xs text-slate-400 leading-tight">Availability</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 sm:right-4 top-3 p-1.5 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </a>
  );
}
