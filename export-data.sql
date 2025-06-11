-- Export TV shows data for Railway migration
\copy (SELECT id, name, description, age_range, episode_length, creator, release_year, end_year, is_ongoing, seasons, stimulation_score, interactivity_level, dialogue_intensity, sound_effects_level, music_tempo, total_music_level, total_sound_effect_time_level, scene_frequency, creativity_rating, available_on, themes, animation_style, image_url, is_featured, subscriber_count, video_count, channel_id, is_youtube_channel, published_at, has_omdb_data, has_youtube_data FROM catalog_tv_shows ORDER BY id) TO 'tv_shows_export.csv' WITH CSV HEADER;

-- Export homepage categories
\copy (SELECT id, name, description, filter_config, display_order, is_active, created_at, updated_at FROM homepage_categories ORDER BY display_order) TO 'homepage_categories_export.csv' WITH CSV HEADER;

-- Export research summaries
\copy (SELECT id, title, summary, full_text, category, image_url, source, original_url, published_date, headline, sub_headline, key_findings, created_at, updated_at FROM research_summaries ORDER BY id) TO 'research_summaries_export.csv' WITH CSV HEADER;