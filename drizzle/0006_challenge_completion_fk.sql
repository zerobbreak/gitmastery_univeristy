-- Add foreign key constraint on user_challenge_completions.challenge_id
-- This ensures data integrity between completions and challenges tables

-- First, clean up any orphaned completion records (where challenge_id doesn't exist)
DELETE FROM user_challenge_completions
WHERE challenge_id NOT IN (SELECT id FROM challenges);

-- Add the foreign key constraint
ALTER TABLE user_challenge_completions
ADD CONSTRAINT fk_user_challenge_completions_challenge
FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
