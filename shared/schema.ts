import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql, eq, asc, desc, and, or, like, inArray, isNull, notInArray } from "drizzle-orm";

// --- User-related tables ---

// Session storage table for auth
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

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  password: text("password"),
  firstName: text("first_name"),
  username: text("username"),
  isAdmin: boolean("is_admin").default(false),
  country: text("country"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  totalPoints: integer("total_points").default(0),
  rank: text("rank").default("TV Watcher"),
  loginStreak: integer("login_streak").default(0),
  lastLoginDate: timestamp("last_login").defaultNow(),
  backgroundColor: text("background_color").default("bg-purple-500"),
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

// --- Favorites table ---
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// --- Reviews table ---
export const tvShowReviews = pgTable("tv_show_reviews", {
  id: serial("id").primaryKey(),
  tvShowId: integer("tv_show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
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

// --- Gamification Tables ---
export const userPointsHistory = pgTable("user_points_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  points: integer("points").notNull(),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  referenceId: integer("reference_id"),
});

export const reviewUpvotes = pgTable("review_upvotes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => tvShowReviews.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const userReadResearch = pgTable("user_read_research", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  researchId: integer("research_id").notNull().references(() => researchSummaries.id, { onDelete: 'cascade' }),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

// NEW: Show submissions table with smart duplicate detection and priority system
export const showSubmissions = pgTable("show_submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  showName: text("show_name").notNull(),
  normalizedName: text("normalized_name").notNull(), // For duplicate detection
  whereTheyWatch: text("where_they_watch").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestCount: integer("request_count").notNull().default(1), // How many users want this
  priorityScore: integer("priority_score").notNull().default(1), // For admin sorting
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  processedBy: text("processed_by").references(() => users.id),
  linkedShowId: integer("linked_show_id").references(() => tvShows.id), // When approved and added
});

export const userReferrals = pgTable("user_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredId: integer("referred_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Track unique clicks on referral links for points
export const referralClicks = pgTable("referral_clicks", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  showId: integer("show_id").notNull().references(() => tvShows.id, { onDelete: 'cascade' }),
  clickerIp: text("clicker_ip").notNull(), // To prevent duplicate clicks from same IP
  clickerUserAgent: text("clicker_user_agent"), // Additional uniqueness check
  pointsAwarded: boolean("points_awarded").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Short URLs for sharing - makes referral links look more professional
export const shortUrls = pgTable("short_urls", {
  id: serial("id").primaryKey(),
  shortCode: text("short_code").notNull().unique(),
  originalUrl: text("original_url").notNull(),
  showId: integer("show_id").notNull().references(() => tvShows.id),
  userId: integer("user_id"), // Optional - for referral tracking
  clicks: integer("clicks").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Temporary GHL users table to track form submissions before full registration
export const tempGhlUsers = pgTable("temp_ghl_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  country: text("country"),
  ghlContactId: text("ghl_contact_id"),
  isVerified: boolean("is_verified").default(false),
  hasCompletedRegistration: boolean("has_completed_registration").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  verifiedAt: timestamp("verified_at"),
  registrationCompletedAt: timestamp("registration_completed_at"),
});

// --- Zod schemas for inserting/selecting ---
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertTvShowSchema = createInsertSchema(tvShows).omit({
  id: true,
});

export const insertTvShowReviewSchema = createInsertSchema(tvShowReviews).omit({
  id: true,
  createdAt: true,
});

export const insertShowSubmissionSchema = createInsertSchema(showSubmissions).omit({
  id: true,
  normalizedName: true,
  status: true,
  requestCount: true,
  priorityScore: true,
  createdAt: true,
  processedAt: true,
  processedBy: true,
  linkedShowId: true,
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

// --- Gamification schemas ---
export const insertUserPointsHistorySchema = createInsertSchema(userPointsHistory).omit({
  id: true,
  createdAt: true,
});

export const insertReviewUpvoteSchema = createInsertSchema(reviewUpvotes).omit({
  id: true,
  createdAt: true,
});

export const insertResearchSummarySchema = createInsertSchema(researchSummaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserReadResearchSchema = createInsertSchema(userReadResearch).omit({
  id: true,
  readAt: true,
});



export const insertUserReferralSchema = createInsertSchema(userReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertTempGhlUserSchema = createInsertSchema(tempGhlUsers).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
  registrationCompletedAt: true,
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

// --- Gamification types ---
export type InsertUserPointsHistory = z.infer<typeof insertUserPointsHistorySchema>;
export type UserPointsHistory = typeof userPointsHistory.$inferSelect;

export type InsertReviewUpvote = z.infer<typeof insertReviewUpvoteSchema>;
export type ReviewUpvote = typeof reviewUpvotes.$inferSelect;

export type InsertResearchSummary = z.infer<typeof insertResearchSummarySchema>;
export type ResearchSummary = typeof researchSummaries.$inferSelect;

export type InsertUserReadResearch = z.infer<typeof insertUserReadResearchSchema>;
export type UserReadResearch = typeof userReadResearch.$inferSelect;

export type InsertShowSubmission = z.infer<typeof insertShowSubmissionSchema>;
export type ShowSubmission = typeof showSubmissions.$inferSelect;

export type InsertUserReferral = z.infer<typeof insertUserReferralSchema>;
export type UserReferral = typeof userReferrals.$inferSelect;

// --- Notifications table ---
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedShowName: text("related_show_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// --- External data schema for GitHub import ---
export const tvShowGitHubSchema = z.object({
  name: z.string(),
  description: z.string(),
  age_range: z.string(),
  episode_length: z.number(),
  themes: z.array(z.string()).or(z.string()).optional().nullable(),
  stimulation_score: z.number().or(z.string().transform(Number)),
  interaction_level: z.string().optional().nullable(),
  dialogue_intensity: z.string().optional().nullable(), 
  sound_effects_level: z.string().optional().nullable(),
  music_tempo: z.string().optional().nullable(),
  total_music_level: z.string().optional().nullable(),
  total_sound_effect_time_level: z.string().optional().nullable(),
  scene_frequency: z.string().optional().nullable(),
});

export type TvShowGitHub = z.infer<typeof tvShowGitHubSchema>;