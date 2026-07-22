import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { FaApple, FaGooglePlay } from "react-icons/fa";
import type { PromoBanner as PromoBannerType } from "../../../shared/catalog-schema";
import kidsafeLogo from "@assets/KidSafeTV_logo_1784713310361.png";

const APP_STORE_URL = "https://apps.apple.com/gb/app/kidsafetv/id6761128940";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.safewatch.mobile";

interface PromoBannerProps {
  placement: string;
  className?: string;
}

function trackEvent(id: number, event: "impression" | "click") {
  fetch(`/api/promo-banners/${id}/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}

function AppBadges({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  const badgeBase =
    "flex items-center gap-2 rounded-lg bg-black border border-slate-600 px-3 py-1.5 text-white hover:bg-slate-800 transition-colors";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={badgeBase}
        aria-label="Download KidSafeTV on the App Store"
      >
        <FaApple className="w-6 h-6" />
        <span className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wide text-slate-300">
            Download on the
          </span>
          <span className="block text-sm font-semibold -mt-0.5">App Store</span>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={badgeBase}
        aria-label="Get KidSafeTV on Google Play"
      >
        <FaGooglePlay className="w-5 h-5" />
        <span className="text-left leading-tight">
          <span className="block text-[9px] uppercase tracking-wide text-slate-300">
            Get it on
          </span>
          <span className="block text-sm font-semibold -mt-0.5">Google Play</span>
        </span>
      </a>
    </div>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={kidsafeLogo}
      alt="KidSafeTV logo"
      className={`object-contain ${className}`}
    />
  );
}

export default function PromoBanner({ placement, className = "" }: PromoBannerProps) {
  const { data: banners = [] } = useQuery<PromoBannerType[]>({
    queryKey: ["/api/promo-banners/placement", placement],
    queryFn: async () => {
      const res = await fetch(`/api/promo-banners/placement/${placement}`);
      if (!res.ok) throw new Error("Failed to fetch banner");
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Show the single active banner for this placement (admin activates one at a time)
  const banner = banners[0];

  // Dismissal (hero variant only) persisted per banner
  const [dismissed, setDismissed] = useState<number | null>(null);
  useEffect(() => {
    if (banner?.variant === "hero") {
      const key = `promo-banner-dismissed-${banner.id}`;
      if (localStorage.getItem(key) === "true") setDismissed(banner.id);
    }
  }, [banner]);

  // Track a single impression per banner per mount
  const trackedId = useRef<number | null>(null);
  useEffect(() => {
    if (banner && trackedId.current !== banner.id && dismissed !== banner.id) {
      trackedId.current = banner.id;
      trackEvent(banner.id, "impression");
    }
  }, [banner, dismissed]);

  if (!banner) return null;
  if (banner.variant === "hero" && dismissed === banner.id) return null;

  const handleClick = () => trackEvent(banner.id, "click");

  const ctaClasses =
    "inline-block whitespace-nowrap rounded-lg bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90";

  if (banner.variant === "hero") {
    const handleDismiss = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem(`promo-banner-dismissed-${banner.id}`, "true");
      setDismissed(banner.id);
    };

    return (
      <div className={`relative bg-slate-900 text-white ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col items-center justify-center gap-3 pr-8 text-center">
            <div className="flex items-center justify-center gap-3">
              {banner.showLogo && <Logo className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />}
              <div className="text-left sm:text-center">
                <a
                  href={banner.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClick}
                  className="hover:opacity-90"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold">
                    {banner.headline.includes("KidSafeTV") ? (
                      <>
                        {banner.headline.split("KidSafeTV")[0]}
                        <span className="text-emerald-400">KidSafeTV</span>
                        {banner.headline.split("KidSafeTV").slice(1).join("KidSafeTV")}
                      </>
                    ) : (
                      banner.headline
                    )}
                  </h3>
                </a>
                {banner.body && (
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto">
                    {banner.body}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {banner.showAppBadges && <AppBadges onClick={handleClick} />}
              <a
                href={banner.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className={ctaClasses}
              >
                {banner.ctaText}
              </a>
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
      </div>
    );
  }

  if (banner.variant === "top-bar") {
    return (
      <a
        href={banner.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 bg-slate-900 px-4 py-2 text-center text-sm text-white hover:bg-slate-800 transition-colors ${className}`}
      >
        {banner.showLogo && <Logo className="w-5 h-5 shrink-0" />}
        <span>
          <span className="font-medium">{banner.headline}</span>{" "}
          <span className="font-bold text-teal-400 underline underline-offset-2 ml-1">
            {banner.ctaText}
          </span>
        </span>
      </a>
    );
  }

  if (banner.variant === "testimonial") {
    return (
      <div className={`rounded-lg bg-slate-900 px-6 py-10 text-center ${className}`}>
        {banner.showLogo && <Logo className="w-12 h-12 mx-auto mb-4" />}
        <p className="mx-auto max-w-3xl text-xl md:text-2xl font-bold italic text-white leading-snug">
          &ldquo;{banner.headline}&rdquo;
        </p>
        {banner.body && <p className="mt-3 text-slate-400">{banner.body}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {banner.showAppBadges && <AppBadges onClick={handleClick} />}
          <a
            href={banner.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className={ctaClasses}
          >
            {banner.ctaText}
          </a>
        </div>
      </div>
    );
  }

  if (banner.variant === "quiet") {
    return (
      <div className={`rounded-lg bg-slate-900 p-6 ${className}`}>
        <div className="flex items-start gap-3">
          {banner.showLogo && <Logo className="w-9 h-9 shrink-0" />}
          <div>
            <p className="font-bold text-white">{banner.headline}</p>
            {banner.body && <p className="mt-2 text-sm text-slate-400">{banner.body}</p>}
          </div>
        </div>
        {banner.showAppBadges && <AppBadges onClick={handleClick} className="mt-4 !justify-start" />}
        <a
          href={banner.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="mt-4 inline-block text-sm font-semibold text-teal-400 hover:text-teal-300"
        >
          {banner.ctaText}
        </a>
      </div>
    );
  }

  // default: card
  return (
    <div
      className={`flex flex-col gap-4 rounded-lg bg-slate-900 p-6 md:flex-row md:items-center md:justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        {banner.showLogo && <Logo className="w-10 h-10 shrink-0" />}
        <div>
          <p className="text-lg font-bold text-white">{banner.headline}</p>
          {banner.body && <p className="mt-1 text-sm text-slate-400">{banner.body}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {banner.showAppBadges && <AppBadges onClick={handleClick} />}
        <a
          href={banner.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={ctaClasses}
        >
          {banner.ctaText}
        </a>
      </div>
    </div>
  );
}
