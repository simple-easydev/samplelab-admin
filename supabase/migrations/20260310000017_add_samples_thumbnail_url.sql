-- Add thumbnail_url to samples table for sample thumbnail images
ALTER TABLE samples
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

COMMENT ON COLUMN samples.thumbnail_url IS 'Optional URL to a thumbnail image for the sample';
