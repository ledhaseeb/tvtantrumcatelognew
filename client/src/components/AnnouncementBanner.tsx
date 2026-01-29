import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X, Sparkles } from "lucide-react";

const BANNER_DISMISSED_KEY = "beta-banner-dismissed";

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
    <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 text-white relative">
      <Link href="/beta-trial" className="block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base pr-8">
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span className="text-center">
              <span className="font-medium">Be first to try our new streaming app.</span>
              {" "}
              <span className="text-amber-200 font-semibold hover:text-amber-100 underline underline-offset-2">
                Apply for beta access
              </span>
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0 hidden sm:block" />
          </div>
        </div>
      </Link>
      <button
        onClick={handleDismiss}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
