ALTER TABLE responses ADD COLUMN IF NOT EXISTS section_times JSONB DEFAULT '{}'::jsonb;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS magic_experience TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '[]'::jsonb;
