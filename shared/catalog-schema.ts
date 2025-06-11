import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Session storage for admin authentication only ---
export const sessions = pgTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => ({
    expireIdx: primaryKey({ columns: [table.expire] }),
  })
);

// --- Admin users only ---
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  username: text("username"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Core TV Shows Schema (unchanged) ---
export const tvShows = pgTable("tv_shows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  ageRange: text("age_range").notNull(),
  episodeLength: integer("episode_length").notNull(), // in minutes
  creator: text("creator"),
  releaseYear: integer("release_year"),
  endYear: integer("end_year"),
  isOngoing: boolean("is_ongoing").default(true),
  
  // Number of seasons
  seasons: integer("seasons"),
  
  // Core metrics from GitHub data
  stimulationScore: integer("stimulation_score").notNull(), // Direct from GitHub data
  interactivityLevel: text("interactivity_level"),
  dialogueIntensity: text("dialogue_intensity"), 
  soundEffectsLevel: text("sound_effects_level"),
  musicTempo: text("music_tempo"),
  totalMusicLevel: text("total_music_level"),
  totalSoundEffectTimeLevel: text("total_sound_effect_time_level"),
  sceneFrequency: text("scene_frequency"),
  
  // We're keeping creativity_rating but removing other specialized ratings
  creativityRating: integer("creativity_rating"),
  
  // We keep these temporarily for backward compatibility
  // They'll be replaced by junction tables
  availableOn: text("available_on").array(),
  themes: text("themes").array(),
  
  // Other fields
  animationStyle: text("animation_style"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false),
  
  // YouTube-specific fields - will eventually be moved to youtube_channels table
  // Keeping temporarily for backward compatibility
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  channelId: text("channel_id"),
  isYouTubeChannel: boolean("is_youtube_channel").default(false),
  publishedAt: text("published_at"),
  
  // API data tracking
  hasOmdbData: boolean("has_omdb_data").default(false),
  hasYoutubeData: boolean("has_youtube_data").default(false),
});

// --- Theme and Platform tables ---
export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url"),
  iconUrl: text("icon_url"),
});

export const tvShowThemes = pgTable("tv_show_themes", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  themeId: integer("theme_id").notNull().references(() => themes.id, { onDelete: 'cascade' }),
});

export const tvShowPlatforms = pgTable("tv_show_platforms", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  platformId: integer("platform_id").notNull().references(() => platforms.id, { onDelete: 'cascade' }),
});

// --- YouTube-specific table ---
export const youtubeChannels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }).unique(),
  channelId: text("channel_id"),
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  publishedAt: text("published_at"),
});

// --- Research Summaries (read-only for catalog) ---
export const researchSummaries = pgTable("research_summaries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  fullText: text("full_text"),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  source: text("source"),
  originalUrl: text("original_url"),
  publishedDate: text("published_date"),
  headline: text("headline"),
  subHeadline: text("sub_headline"),
  keyFindings: text("key_findings"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Homepage Categories (admin controlled) ---
export const homepageCategories = pgTable("homepage_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  filterConfig: jsonb("filter_config").notNull(), // Stores the filter logic
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Zod schemas for inserting/selecting ---
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertYoutubeChannelSchema = createInsertSchema(youtubeChannels).omit({
  id: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
});

export const insertPlatformSchema = createInsertSchema(platforms).omit({
  id: true,
});

export const insertTvShowThemeSchema = createInsertSchema(tvShowThemes).omit({
  id: true,
});

export const insertTvShowPlatformSchema = createInsertSchema(tvShowPlatforms).omit({
  id: true,
});

export const insertResearchSummarySchema = createInsertSchema(researchSummaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHomepageCategorySchema = createInsertSchema(homepageCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// --- TypeScript types for database entities ---
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type TvShow = typeof tvShows.$inferSelect;

export type InsertYoutubeChannel = z.infer<typeof insertYoutubeChannelSchema>;
export type YoutubeChannel = typeof youtubeChannels.$inferSelect;

export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type Theme = typeof themes.$inferSelect;

export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Platform = typeof platforms.$inferSelect;

export type InsertTvShowTheme = z.infer<typeof insertTvShowThemeSchema>;
export type TvShowTheme = typeof tvShowThemes.$inferSelect;

export type InsertTvShowPlatform = z.infer<typeof insertTvShowPlatformSchema>;
export type TvShowPlatform = typeof tvShowPlatforms.$inferSelect;

export type InsertResearchSummary = z.infer<typeof insertResearchSummarySchema>;
export type ResearchSummary = typeof researchSummaries.$inferSelect;

export type InsertHomepageCategory = z.infer<typeof insertHomepageCategorySchema>;
export type HomepageCategory = typeof homepageCategories.$inferSelect & {
  showCount?: number;
};