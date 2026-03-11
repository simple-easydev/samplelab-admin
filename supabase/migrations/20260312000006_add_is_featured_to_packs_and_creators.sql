-- Add is_featured column to packs and creators.

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN packs.is_featured IS 'Whether the pack is featured (e.g. on home or discovery).';
COMMENT ON COLUMN creators.is_featured IS 'Whether the creator is featured (e.g. on home or discovery).';
