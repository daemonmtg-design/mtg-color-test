-- Supabase Migration: Friend Ratings

-- 1. Add friend_token to responses
ALTER TABLE responses
ADD COLUMN friend_token TEXT UNIQUE;

-- Create an index to quickly look up responses by friend_token
CREATE INDEX idx_responses_friend_token ON responses(friend_token);

-- 2. Create friend_ratings table
CREATE TABLE friend_ratings (
    id SERIAL PRIMARY KEY,
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relationship TEXT NOT NULL CHECK (relationship IN ('friend', 'partner', 'family', 'coworker', 'other')),
    known_for TEXT NOT NULL CHECK (known_for IN ('less than 1 year', '1-5 years', 'more than 5 years')),
    answers JSONB NOT NULL,
    trait_scores JSONB NOT NULL,
    colors TEXT[],
    colors_unsure BOOLEAN
);

-- 3. Enable RLS and restrict public access
ALTER TABLE friend_ratings ENABLE ROW LEVEL SECURITY;
