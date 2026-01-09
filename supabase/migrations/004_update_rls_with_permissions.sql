-- ============================================================
-- SALON PRO - UPDATE RLS POLICIES WITH PERMISSION-BASED ACCESS
-- ============================================================
-- Updates all resource RLS policies to check permissions
-- Only admin OR salon members with specific permissions can manage
-- ============================================================

-- ============================================================
-- SECTION 1: HELPER FUNCTION - CAN MANAGE RESOURCE
-- ============================================================
-- Check if user can perform action on resource (admin OR has permission)
CREATE OR REPLACE FUNCTION public.can_manage_resource(check_salon_id UUID, resource TEXT, action TEXT)
RETURNS BOOLEAN AS $$
  SELECT (
    is_system_admin()
    OR has_permission_in_salon(check_salon_id, resource, action)
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 2: UPDATE CUSTOMER RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can insert customers to their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can update customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can delete customers of their salon" ON public.customer;

CREATE POLICY "Users can view customers of their salon" ON public.customer
  FOR SELECT USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'customers', 'read')
  );

CREATE POLICY "Users can insert customers to their salon" ON public.customer
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR (salon_id IS NULL AND has_permission('customers', 'create'))
    OR has_permission_in_salon(salon_id, 'customers', 'create')
  );

CREATE POLICY "Users can update customers of their salon" ON public.customer
  FOR UPDATE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'customers', 'update')
  );

CREATE POLICY "Users can delete customers of their salon" ON public.customer
  FOR DELETE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'customers', 'delete')
  );

-- ============================================================
-- SECTION 3: UPDATE SERVICE CATEGORIES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view service categories of their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can insert service categories to their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can update service categories of their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can delete service categories of their salon" ON public.service_categories;

CREATE POLICY "Users can view service categories of their salon" ON public.service_categories
  FOR SELECT USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'read')
  );

CREATE POLICY "Users can insert service categories to their salon" ON public.service_categories
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR (salon_id IS NULL AND has_permission('services', 'create'))
    OR has_permission_in_salon(salon_id, 'services', 'create')
  );

CREATE POLICY "Users can update service categories of their salon" ON public.service_categories
  FOR UPDATE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'update')
  );

CREATE POLICY "Users can delete service categories of their salon" ON public.service_categories
  FOR DELETE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'delete')
  );

-- ============================================================
-- SECTION 4: UPDATE SERVICES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view services of their salon" ON public.services;
DROP POLICY IF EXISTS "Users can insert services to their salon" ON public.services;
DROP POLICY IF EXISTS "Users can update services of their salon" ON public.services;
DROP POLICY IF EXISTS "Users can delete services of their salon" ON public.services;

CREATE POLICY "Users can view services of their salon" ON public.services
  FOR SELECT USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'read')
  );

CREATE POLICY "Users can insert services to their salon" ON public.services
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR (salon_id IS NULL AND has_permission('services', 'create'))
    OR has_permission_in_salon(salon_id, 'services', 'create')
  );

CREATE POLICY "Users can update services of their salon" ON public.services
  FOR UPDATE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'update')
  );

CREATE POLICY "Users can delete services of their salon" ON public.services
  FOR DELETE USING (
    is_system_admin() 
    OR has_permission_in_salon(salon_id, 'services', 'delete')
  );

-- ============================================================
-- SECTION 5: UPDATE SALONS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Members can view their salons" ON public.salons;
DROP POLICY IF EXISTS "Owners can update salon" ON public.salons;

-- Everyone in a salon can view it, admins can see all
CREATE POLICY "Members can view their salons" ON public.salons
  FOR SELECT USING (
    is_system_admin() 
    OR is_salon_member(id)
  );

-- Only owners and admins can update salon details
CREATE POLICY "Owners and admins can update salon" ON public.salons
  FOR UPDATE USING (
    is_system_admin() 
    OR is_salon_owner(id)
  );

-- ============================================================
-- SECTION 6: UPDATE PROFILES RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Users can view own profile, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR is_system_admin()
  );

-- ============================================================
-- SECTION 7: UPDATE SALON_MEMBERS RLS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "Members can view own membership" ON public.salon_members;
DROP POLICY IF EXISTS "Members can view salon colleagues" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.salon_members;

-- Users can view own membership, admins can view all
CREATE POLICY "Members can view own membership" ON public.salon_members
  FOR SELECT USING (
    user_id = auth.uid() 
    OR is_system_admin()
  );

-- Members can view colleagues OR admin can view all OR has employees read permission
CREATE POLICY "Members can view salon colleagues" ON public.salon_members
  FOR SELECT USING (
    is_system_admin()
    OR is_salon_member(salon_id)
    OR has_permission_in_salon(salon_id, 'employees', 'read')
  );

-- Only owners and admins can delete members
CREATE POLICY "Owners and admins can delete members" ON public.salon_members
  FOR DELETE USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );
