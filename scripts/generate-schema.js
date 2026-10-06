const fs = require('fs');
const path = require('path');

// We need to read lib/settings.ts, but that's TS. We can just hardcode the defaults or require a compiled version.
// Actually, it's simpler:
const settings = {
  weights: { values: 0.35, bigfive: 0.40, enneagram: 0.25 },
  softmax_tau: 1.542,
  dilemma_strength: 0.05,
  dilemma_scale: 6.0,
  include_ratio: 0.72,
  lean_ratio: 0.62,
  label_close: 0.04,
  label_moderate: 0.10
};

const typicalValues = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/typical_values.json'), 'utf-8'));
const norms = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/big_five_country_norms.json'), 'utf-8'));

const sql = `-- Supabase Schema for MTG Color Quiz

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Settings Versions
CREATE TABLE settings_versions (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    note TEXT,
    active BOOLEAN DEFAULT false,
    settings JSONB NOT NULL,
    typical_values JSONB NOT NULL,
    norms JSONB NOT NULL
);

-- Enable RLS (no public policies, so only Service Role can access)
ALTER TABLE settings_versions ENABLE ROW LEVEL SECURITY;

-- Insert initial active settings
INSERT INTO settings_versions (note, active, settings, typical_values, norms)
VALUES (
    'Initial v1.0 specification defaults',
    true,
    '${JSON.stringify(settings).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(typicalValues).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(norms).replace(/'/g, "''")}'::jsonb
);

-- 2. Responses
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    public_id TEXT NOT NULL UNIQUE,
    secret_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
    version TEXT,
    country TEXT,
    comparison_group TEXT,
    settings_version_id INTEGER REFERENCES settings_versions(id),
    last_section TEXT,
    answers JSONB,
    dilemma_display_order JSONB,
    raw JSONB,
    z JSONB,
    combined JSONB,
    dilemma JSONB,
    base_percentages JSONB,
    percentages JSONB,
    included TEXT[],
    leans TEXT[],
    missing TEXT[],
    label TEXT,
    result_name TEXT
);

-- Index for public lookup
CREATE INDEX idx_responses_public_id ON responses(public_id);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- 3. Feedback
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accuracy INTEGER CHECK (accuracy BETWEEN 1 AND 5),
    self_colors TEXT[],
    self_unsure BOOLEAN
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

`;

fs.writeFileSync(path.join(__dirname, '../supabase/schema.sql'), sql);
console.log('Schema generated at supabase/schema.sql');
