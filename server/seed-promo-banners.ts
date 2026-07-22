import { pool } from "./db";

const DEFAULT_BANNERS = [
  {
    placement: "announcement",
    name: "Announcement Hero",
    headline: "Safer streaming is finally here! Get KidSafeTV",
    body: "Watch recommended content, instantly create playlists and enjoy wind-down protocols that avoid TV tantrums.",
    ctaText: "Try KidSafeTV free →",
    targetUrl: "https://kidsafetv.com",
    variant: "hero",
    showLogo: true,
    showAppBadges: true,
  },
  {
    placement: "site-wide",
    name: "Site-Wide Top Bar",
    headline: "94% of sessions end without a tantrum — see the app behind the data",
    body: null,
    ctaText: "Try KidSafeTV free for 14 days →",
    targetUrl: "https://kidsafetv.com",
    variant: "top-bar",
  },
  {
    placement: "home",
    name: "Home Testimonial",
    headline: "We went from daily screen-time meltdowns to calm hand-offs in under a week.",
    body: "KidSafeTV parent, kids aged 3 and 6",
    ctaText: "Try KidSafeTV free →",
    targetUrl: "https://kidsafetv.com",
    variant: "testimonial",
  },
  {
    placement: "browse",
    name: "Browse Shows Banner",
    headline: "You're browsing the right content. Now let it run itself.",
    body: "KidSafeTV turns these shows into smart playlists with a built-in wind-down.",
    ctaText: "Try it free →",
    targetUrl: "https://kidsafetv.com",
    variant: "card",
  },
  {
    placement: "compare",
    name: "Compare Shows Banner",
    headline: "Comparing stimulation scores? KidSafeTV does it for you, every episode.",
    body: "Playlists that step down stimulation automatically — no card needed for the 14-day trial.",
    ctaText: "Start free trial →",
    targetUrl: "https://kidsafetv.com",
    variant: "card",
  },
  {
    placement: "research",
    name: "Research Quiet Banner",
    headline: "Built on the same research you're reading.",
    body: "KidSafeTV applies stimulation science to real screen time for ages 2–8. Founding access $39/yr.",
    ctaText: "See how it works →",
    targetUrl: "https://kidsafetv.com",
    variant: "quiet",
  },
];

export async function seedPromoBanners(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS promo_banners (
        id SERIAL PRIMARY KEY,
        placement TEXT NOT NULL,
        name TEXT NOT NULL,
        headline TEXT NOT NULL,
        body TEXT,
        cta_text TEXT NOT NULL,
        target_url TEXT NOT NULL DEFAULT 'https://kidsafetv.com',
        variant TEXT NOT NULL DEFAULT 'card',
        show_logo BOOLEAN NOT NULL DEFAULT false,
        show_app_badges BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT false,
        impressions INTEGER NOT NULL DEFAULT 0,
        clicks INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Safe additive migration for existing databases (e.g. production)
    await client.query(`
      ALTER TABLE promo_banners
        ADD COLUMN IF NOT EXISTS show_logo BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS show_app_badges BOOLEAN NOT NULL DEFAULT false
    `);

    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM promo_banners");
    if (rows[0].count > 0) return; // already seeded

    for (const b of DEFAULT_BANNERS) {
      await client.query(
        `INSERT INTO promo_banners (placement, name, headline, body, cta_text, target_url, variant, show_logo, show_app_badges, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
        [b.placement, b.name, b.headline, b.body, b.ctaText, b.targetUrl, b.variant, (b as any).showLogo ?? false, (b as any).showAppBadges ?? false]
      );
    }
    console.log(`[SEED] Inserted ${DEFAULT_BANNERS.length} default promo banners`);
  } finally {
    client.release();
  }
}
