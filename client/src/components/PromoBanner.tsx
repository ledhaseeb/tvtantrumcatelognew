import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PromoBanner as PromoBannerType } from "../../../shared/catalog-schema";

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

  // Track a single impression per banner per mount
  const trackedId = useRef<number | null>(null);
  useEffect(() => {
    if (banner && trackedId.current !== banner.id) {
      trackedId.current = banner.id;
      trackEvent(banner.id, "impression");
    }
  }, [banner]);

  if (!banner) return null;

  const handleClick = () => trackEvent(banner.id, "click");

  const ctaClasses =
    "inline-block whitespace-nowrap rounded-lg bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90";

  if (banner.variant === "top-bar") {
    return (
      <a
        href={banner.targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`block bg-slate-900 px-4 py-2 text-center text-sm text-white hover:bg-slate-800 transition-colors ${className}`}
      >
        <span className="font-medium">{banner.headline}</span>{" "}
        <span className="font-bold text-teal-400 underline underline-offset-2 ml-1">
          {banner.ctaText}
        </span>
      </a>
    );
  }

  if (banner.variant === "testimonial") {
    return (
      <div className={`rounded-lg bg-slate-900 px-6 py-10 text-center ${className}`}>
        <p className="mx-auto max-w-3xl text-xl md:text-2xl font-bold italic text-white leading-snug">
          &ldquo;{banner.headline}&rdquo;
        </p>
        {banner.body && <p className="mt-3 text-slate-400">{banner.body}</p>}
        <a
          href={banner.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className={`${ctaClasses} mt-6`}
        >
          {banner.ctaText}
        </a>
      </div>
    );
  }

  if (banner.variant === "quiet") {
    return (
      <div className={`rounded-lg bg-slate-900 p-6 ${className}`}>
        <p className="font-bold text-white">{banner.headline}</p>
        {banner.body && <p className="mt-2 text-sm text-slate-400">{banner.body}</p>}
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
      <div>
        <p className="text-lg font-bold text-white">{banner.headline}</p>
        {banner.body && <p className="mt-1 text-sm text-slate-400">{banner.body}</p>}
      </div>
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
  );
}
