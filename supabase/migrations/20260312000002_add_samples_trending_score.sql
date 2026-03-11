-- Add trending_score to samples (e.g. for sorting by trending).

ALTER TABLE samples
  ADD COLUMN IF NOT EXISTS trending_score NUMERIC(12, 4) DEFAULT 0;

COMMENT ON COLUMN samples.trending_score IS 'Score used for trending/sorting (e.g. popularity over time).';
