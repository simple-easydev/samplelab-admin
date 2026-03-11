-- Add release_date to packs. Set when status becomes 'Published' (first time or re-publish).

ALTER TABLE packs
  ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN packs.release_date IS 'Set when pack status is Published (on insert or when status changes to Published).';

-- Trigger function: set release_date when status is Published
CREATE OR REPLACE FUNCTION packs_set_release_date_on_published()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'Published' THEN
    -- On INSERT, or on UPDATE when just published (keep existing release_date if already set and still Published)
    IF TG_OP = 'INSERT' THEN
      NEW.release_date := NOW();
    ELSIF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM 'Published' OR OLD.release_date IS NULL) THEN
      NEW.release_date := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS packs_set_release_date_on_published ON packs;
CREATE TRIGGER packs_set_release_date_on_published
  BEFORE INSERT OR UPDATE OF status
  ON packs
  FOR EACH ROW
  EXECUTE FUNCTION packs_set_release_date_on_published();

-- Backfill: set release_date for packs already Published
UPDATE packs
SET release_date = COALESCE(updated_at, created_at, NOW())
WHERE status = 'Published' AND release_date IS NULL;
