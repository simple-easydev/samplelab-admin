-- Migration: Add "Deleted" status to samples for soft deletes
-- This allows samples to be removed from packs while preserving download history
-- Users who previously downloaded samples can still access them even if marked as Deleted

-- Drop the existing CHECK constraint
ALTER TABLE samples DROP CONSTRAINT IF EXISTS samples_status_check;

-- Add new CHECK constraint with "Deleted" status
ALTER TABLE samples 
  ADD CONSTRAINT samples_status_check 
  CHECK (status IN ('Active', 'Disabled', 'Deleted'));

-- Update RLS policy to exclude Deleted samples from public view
-- (only Active samples in Published packs should be visible to non-admins)
DROP POLICY IF EXISTS "Anyone can view active samples in published packs" ON samples;

CREATE POLICY "Anyone can view active samples in published packs" ON samples
  FOR SELECT USING (
    status = 'Active' AND 
    EXISTS (SELECT 1 FROM packs WHERE id = pack_id AND status = 'Published')
  );

-- Admin policy remains unchanged - admins can see all samples including Deleted
-- This is already covered by: "Admins can view all samples"

-- Add comment explaining soft delete behavior
COMMENT ON COLUMN samples.status IS 
  'Sample status: Active (visible in pack), Disabled (hidden but in pack), Deleted (removed from pack but preserved for download history)';

-- Note: Deleted samples are excluded from pack sample counts and listings
-- but remain in database to preserve user download history and access
