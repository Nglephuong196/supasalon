-- ============================================================
-- PRODUCTION RESET SCRIPT
-- ⚠️ WARNING: This will DELETE ALL DATA! Use only if you want fresh start.
-- ============================================================

-- Step 1: Drop RLS policies first (they depend on functions)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Members can view their salons" ON public.salons;
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;
DROP POLICY IF EXISTS "Owners can update salon" ON public.salons;

DROP POLICY IF EXISTS "Members can view own membership" ON public.salon_members;
DROP POLICY IF EXISTS "Members can view salon colleagues" ON public.salon_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.salon_members;
DROP POLICY IF EXISTS "Members can view salon members" ON public.salon_members;

DROP POLICY IF EXISTS "Users can view customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can insert customers to their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can update customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can delete customers of their salon" ON public.customer;

-- Step 2: Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_customer_salon_id_trigger ON public.customer;

-- Step 3: Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.set_customer_salon_id();
DROP FUNCTION IF EXISTS public.get_user_salon_id();
DROP FUNCTION IF EXISTS public.is_salon_owner(UUID);
DROP FUNCTION IF EXISTS public.is_salon_member(UUID);

-- Step 4: Drop tables (in order due to foreign keys)
DROP TABLE IF EXISTS public.customer CASCADE;
DROP TABLE IF EXISTS public.salon_members CASCADE;
DROP TABLE IF EXISTS public.salons CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 5: Drop enum type
DROP TYPE IF EXISTS public.salon_role CASCADE;

-- Step 6: Clear migration history (so new migrations can run)
DELETE FROM supabase_migrations.schema_migrations 
WHERE version IN (
  '20251225064142_customer',
  '20251229075400_salon_system', 
  '20251229093000_customer_multi_tenant',
  '001_initial_schema'
);

-- ============================================================
-- DONE! Now run production_schema.sql to recreate everything
-- ============================================================
