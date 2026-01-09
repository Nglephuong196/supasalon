-- ============================================================
-- SALON PRO - MEMBER PERMISSIONS MIGRATION
-- ============================================================
-- Adds granular permissions to salon_members table
-- Only salon owners and system admins can manage permissions
-- ============================================================

-- ============================================================
-- SECTION 1: ADD PERMISSIONS COLUMN
-- ============================================================
ALTER TABLE public.salon_members 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Example permissions structure:
-- {
--   "customers": { "create": true, "read": true, "update": true, "delete": false },
--   "services": { "create": true, "read": true, "update": false, "delete": false },
--   "bookings": { "create": true, "read": true, "update": true, "delete": false },
--   "products": { "create": true, "read": true, "update": true, "delete": false },
--   "employees": { "create": false, "read": true, "update": false, "delete": false }
-- }

-- ============================================================
-- SECTION 2: HELPER FUNCTION - CHECK IF USER IS SYSTEM ADMIN
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 3: HELPER FUNCTION - CHECK IF CAN MANAGE PERMISSIONS
-- ============================================================
-- Only salon owner OR system admin can manage member permissions
CREATE OR REPLACE FUNCTION public.can_manage_permissions(target_salon_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (
    is_salon_owner(target_salon_id) 
    OR is_system_admin()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 4: HELPER FUNCTION - CHECK USER PERMISSION
-- ============================================================
-- Check if user has a specific permission for a resource
CREATE OR REPLACE FUNCTION public.has_permission(resource TEXT, action TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE user_id = auth.uid()
    AND (
      role = 'owner'  -- owners have all permissions
      OR (permissions->resource->>action)::boolean = true
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 5: HELPER FUNCTION - CHECK USER PERMISSION FOR SALON
-- ============================================================
-- Check if user has a specific permission for a resource in a specific salon
CREATE OR REPLACE FUNCTION public.has_permission_in_salon(check_salon_id UUID, resource TEXT, action TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE user_id = auth.uid()
    AND salon_id = check_salon_id
    AND (
      role = 'owner'  -- owners have all permissions
      OR (permissions->resource->>action)::boolean = true
    )
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 6: UPDATE RLS POLICIES FOR SALON_MEMBERS
-- ============================================================
-- Drop the existing update policy (it allowed any owner to update)
DROP POLICY IF EXISTS "Owners can update members" ON public.salon_members;

-- Create new policy: only owners and admins can update members (including permissions)
CREATE POLICY "Owners and admins can update members" ON public.salon_members
  FOR UPDATE USING (can_manage_permissions(salon_id));

-- ============================================================
-- SECTION 7: DEFAULT PERMISSIONS BY ROLE
-- ============================================================
-- Function to get default permissions based on role
CREATE OR REPLACE FUNCTION public.get_default_permissions(member_role public.salon_role)
RETURNS JSONB AS $$
BEGIN
  CASE member_role
    WHEN 'owner' THEN
      -- Owners have all permissions (but we check role directly, so this is just for reference)
      RETURN '{
        "customers": { "create": true, "read": true, "update": true, "delete": true },
        "services": { "create": true, "read": true, "update": true, "delete": true },
        "bookings": { "create": true, "read": true, "update": true, "delete": true },
        "products": { "create": true, "read": true, "update": true, "delete": true },
        "employees": { "create": true, "read": true, "update": true, "delete": true }
      }'::jsonb;
    WHEN 'manager' THEN
      RETURN '{
        "customers": { "create": true, "read": true, "update": true, "delete": true },
        "services": { "create": true, "read": true, "update": true, "delete": false },
        "bookings": { "create": true, "read": true, "update": true, "delete": true },
        "products": { "create": true, "read": true, "update": true, "delete": false },
        "employees": { "create": false, "read": true, "update": false, "delete": false }
      }'::jsonb;
    WHEN 'employee' THEN
      RETURN '{
        "customers": { "create": true, "read": true, "update": true, "delete": false },
        "services": { "create": false, "read": true, "update": false, "delete": false },
        "bookings": { "create": true, "read": true, "update": true, "delete": false },
        "products": { "create": false, "read": true, "update": false, "delete": false },
        "employees": { "create": false, "read": true, "update": false, "delete": false }
      }'::jsonb;
    ELSE
      RETURN '{}'::jsonb;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- SECTION 8: TRIGGER - AUTO-SET DEFAULT PERMISSIONS ON INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set permissions if they are empty or null
  IF NEW.permissions IS NULL OR NEW.permissions = '{}'::jsonb THEN
    NEW.permissions := get_default_permissions(NEW.role);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_default_permissions_trigger ON public.salon_members;
CREATE TRIGGER set_default_permissions_trigger
  BEFORE INSERT ON public.salon_members
  FOR EACH ROW EXECUTE FUNCTION public.set_default_permissions();

-- ============================================================
-- SECTION 9: UPDATE EXISTING MEMBERS WITH DEFAULT PERMISSIONS
-- ============================================================
UPDATE public.salon_members
SET permissions = get_default_permissions(role)
WHERE permissions IS NULL OR permissions = '{}'::jsonb;
