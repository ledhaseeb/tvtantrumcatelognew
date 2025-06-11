import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- User-related tables ---

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  username: text("username").notNull(),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isApproved: boolean("is_approved").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  username: true,
  country: true,
  isAdmin: true,
  isApproved: true,
});

// --- Favorites table ---

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// --- Core TV Shows Schema ---

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

// --- YouTube-specific table ---

export const youtubeChannels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }).unique(),
  channelId: text("channel_id"),
  subscriberCount: text("subscriber_count"),
  videoCount: text("video_count"),
  publishedAt: text("published_at"),
});

// --- Theme and Platform tables ---

export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// --- Junction tables ---

export const tvShowThemes = pgTable("tv_show_themes", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  themeId: integer("theme_id").notNull().references(() => themes.id, { onDelete: 'cascade' }),
}, (t) => ({
  unq: primaryKey({ columns: [t.tvShowId, t.themeId] }),
}));

export const tvShowPlatforms = pgTable("tv_show_platforms", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  platformId: integer("platform_id").notNull().references(() => platforms.id, { onDelete: 'cascade' }),
}, (t) => ({
  unq: primaryKey({ columns: [t.tvShowId, t.platformId] }),
}));

// --- Reviews table ---

export const tvShowReviews = pgTable("tv_show_reviews", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }),
  userName: text("user_name").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  review: text("review").notNull(),
  showName: text("show_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Analytics tables ---

export const tvShowSearches = pgTable("tv_show_searches", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  searchCount: integer("search_count").notNull().default(1),
  lastSearched: timestamp("last_searched").notNull().defaultNow(),
});

export const tvShowViews = pgTable("tv_show_views", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  viewCount: integer("view_count").notNull().default(1),
  lastViewed: timestamp("last_viewed").notNull().defaultNow(),
});

// --- Zod schemas for inserting/selecting ---

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertTvShowReviewSchema = createInsertSchema(tvShowReviews).omit({
  id: true,
  createdAt: true,
});

export const insertTvShowSearchSchema = createInsertSchema(tvShowSearches).omit({
  id: true,
  lastSearched: true,
});

export const insertTvShowViewSchema = createInsertSchema(tvShowViews).omit({
  id: true,
  lastViewed: true, 
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

// --- TypeScript types for database entities ---

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertTvShow = z.infer<typeof insertTvShowSchema>;
export type TvShow = typeof tvShows.$inferSelect;

export type InsertTvShowReview = z.infer<typeof insertTvShowReviewSchema>;
export type TvShowReview = typeof tvShowReviews.$inferSelect;

export type InsertTvShowSearch = z.infer<typeof insertTvShowSearchSchema>;
export type TvShowSearch = typeof tvShowSearches.$inferSelect;

export type InsertTvShowView = z.infer<typeof insertTvShowViewSchema>;
export type TvShowView = typeof tvShowViews.$inferSelect;

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

// --- GitHub show format based on actual data structure ---
export const tvShowGitHubSchema = z.object({
  title: z.string(),
  stimulation_score: z.number(),
  platform: z.string(),
  target_age_group: z.string(),
  seasons: z.string().nullable(),
  avg_episode_length: z.string().nullable(),
  themes: z.array(z.string()),
  interactivity_level: z.string(),
  animation_style: z.string(),
  dialogue_intensity: z.string(),
  sound_effects_level: z.string(),
  music_tempo: z.string(),
  total_music_level: z.string(),
  total_sound_effect_time_level: z.string(),
  scene_frequency: z.string(),
  image_filename: z.string(),
  release_year: z.number().optional(),
  end_year: z.number().optional(),
  // We'll add these derived fields for our application
  id: z.number().optional().default(() => Math.floor(Math.random() * 10000)),
  imageUrl: z.string().optional(),
});

export type TvShowGitHub = z.infer<typeof tvShowGitHubSchema>;