CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tv_show_id" integer NOT NULL,
	"created_at" text DEFAULT '2025-05-13T11:29:00.429Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_show_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"tv_show_id" integer NOT NULL,
	"user_name" text NOT NULL,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"created_at" text DEFAULT '2025-05-13T11:29:00.431Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tv_show_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tv_show_id" integer NOT NULL,
	"search_count" integer DEFAULT 1 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"last_searched" text DEFAULT '2025-05-13T11:29:00.431Z' NOT NULL,
	"last_viewed" text
);
--> statement-breakpoint
CREATE TABLE "tv_shows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"age_range" text NOT NULL,
	"episode_length" integer NOT NULL,
	"creator" text,
	"release_year" integer,
	"end_year" integer,
	"is_ongoing" boolean DEFAULT true,
	"seasons" integer,
	"stimulation_score" integer NOT NULL,
	"interactivity_level" text,
	"dialogue_intensity" text,
	"sound_effects_level" text,
	"music_tempo" text,
	"total_music_level" text,
	"total_sound_effect_time_level" text,
	"scene_frequency" text,
	"friendship_rating" integer,
	"problem_solving_rating" integer,
	"relatable_situations_rating" integer,
	"emotional_intelligence_rating" integer,
	"creativity_rating" integer,
	"educational_value_rating" integer,
	"available_on" text[],
	"themes" text[],
	"animation_style" text,
	"image_url" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	"username" text NOT NULL,
	"country" text,
	"created_at" text DEFAULT '2025-05-13T11:29:00.425Z' NOT NULL,
	"is_approved" boolean DEFAULT false,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
