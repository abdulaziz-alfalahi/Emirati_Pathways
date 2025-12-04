ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'candidate';
UPDATE users SET user_type='candidate' WHERE user_type IS NULL;