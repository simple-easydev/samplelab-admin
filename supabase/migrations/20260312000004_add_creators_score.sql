-- Add rank column to creators.

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;

COMMENT ON COLUMN creators.rank IS 'Creator rank (e.g. for ranking or trending).';
