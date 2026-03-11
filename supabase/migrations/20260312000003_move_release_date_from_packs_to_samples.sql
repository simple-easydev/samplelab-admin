-- Remove release_date from packs; add release_date to samples.
-- Sample release_date is set when sample status is 'Active'.

-- 1. Drop pack trigger and column
DROP TRIGGER IF EXISTS packs_set_release_date_on_published ON packs;
ALTER TABLE packs DROP COLUMN IF EXISTS release_date;
DROP FUNCTION IF EXISTS packs_set_release_date_on_published();

-- 2. Add release_date to samples
ALTER TABLE samples
  ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN samples.release_date IS 'Set when sample status is Active (on insert or when status changes to Active).';

-- 3. Trigger: set release_date when sample status is Active
CREATE OR REPLACE FUNCTION samples_set_release_date_on_active()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'Active' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.release_date := NOW();
    ELSIF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM 'Active' OR OLD.release_date IS NULL) THEN
      NEW.release_date := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS samples_set_release_date_on_active ON samples;
CREATE TRIGGER samples_set_release_date_on_active
  BEFORE INSERT OR UPDATE OF status
  ON samples
  FOR EACH ROW
  EXECUTE FUNCTION samples_set_release_date_on_active();

-- 4. Backfill: set release_date for samples already Active
UPDATE samples
SET release_date = COALESCE(updated_at, created_at, NOW())
WHERE status = 'Active' AND release_date IS NULL;
