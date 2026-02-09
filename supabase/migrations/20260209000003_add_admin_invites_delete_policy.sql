-- =====================================================
-- Add Delete and Update Policies for Admin Invites
-- =====================================================
-- Allows admins to delete and update invitations
-- =====================================================

-- Add policy to allow admins to delete invites
DROP POLICY IF EXISTS "Admins can delete invites" ON admin_invites;
CREATE POLICY "Admins can delete invites" ON admin_invites
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true AND role = 'full_admin')
  );

-- Add policy to allow admins to update invites (for resending)
DROP POLICY IF EXISTS "Admins can update invites" ON admin_invites;
CREATE POLICY "Admins can update invites" ON admin_invites
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );
