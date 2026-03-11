-- Add rank column to genres.

ALTER TABLE genres
  ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

COMMENT ON COLUMN genres.rank IS 'Genre rank (e.g. for ordering or display).';
