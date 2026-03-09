import { useState, useEffect } from "react";
import { X } from "lucide-react";

const BANNER_DISMISSED_KEY = "kidsafetv-banner-dismissed";

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
      className="block bg-slate-800 text-white relative hover:bg-slate-750 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col items-center justify-center gap-0.5 pr-8 text-center">
          <p className="text-base sm:text-lg font-bold">
            The end of <span className="text-emerald-400">overstimulation.</span>
          </p>
          <p className="text-xs sm:text-sm text-slate-300">
            Safer streaming from the makers of tvtantrum.com
          </p>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </a>
  );
}
