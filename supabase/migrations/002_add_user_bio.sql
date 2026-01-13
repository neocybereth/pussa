-- Add bio column to users table
ALTER TABLE users ADD COLUMN bio TEXT;

-- Add index for potential bio search
CREATE INDEX idx_users_bio ON users USING gin(to_tsvector('english', COALESCE(bio, '')));
