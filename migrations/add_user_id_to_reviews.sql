-- Add user_id column to tv_show_reviews table
ALTER TABLE tv_show_reviews ADD COLUMN user_id INTEGER;

-- Add foreign key constraint
ALTER TABLE tv_show_reviews 
ADD CONSTRAINT fk_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Add show_name column to store the name of the show for easier querying
ALTER TABLE tv_show_reviews ADD COLUMN show_name TEXT;