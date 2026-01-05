-- ============================================================
-- SALON PRO - CONSOLIDATED SCHEMA MIGRATION
-- ============================================================
-- This file contains all tables, RLS policies, and functions
-- for the multi-tenant salon management system.
-- 
-- Run with: npx supabase db reset (local)
-- For production: Copy to Supabase SQL Editor and execute
-- ============================================================

-- ============================================================
-- SECTION 1: PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 2: SALONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  province TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 3: SALON ROLE ENUM
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.salon_role AS ENUM ('owner', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- SECTION 4: SALON MEMBERS TABLE (junction table with roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.salon_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  role public.salon_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, salon_id)
);

-- Ensure only one owner per salon
CREATE UNIQUE INDEX IF NOT EXISTS one_owner_per_salon 
  ON public.salon_members(salon_id) 
  WHERE role = 'owner';

-- ============================================================
-- SECTION 5: CUSTOMER TABLE (with multi-tenancy)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customer (
  id SERIAL PRIMARY KEY,
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  gender VARCHAR(50),
  birthday DATE,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Index for faster salon-based queries
CREATE INDEX IF NOT EXISTS idx_customer_salon_id ON public.customer(salon_id);

-- ============================================================
-- SECTION 6: ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 7: HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================

-- Get current user's salon_id
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM public.salon_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is salon owner
CREATE OR REPLACE FUNCTION public.is_salon_owner(check_salon_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE salon_id = check_salon_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is salon member
CREATE OR REPLACE FUNCTION public.is_salon_member(check_salon_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE salon_id = check_salon_id 
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SECTION 8: RLS POLICIES - PROFILES
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- SECTION 9: RLS POLICIES - SALONS
-- ============================================================
DROP POLICY IF EXISTS "Members can view their salons" ON public.salons;
DROP POLICY IF EXISTS "Authenticated users can create salons" ON public.salons;
DROP POLICY IF EXISTS "Owners can update salon" ON public.salons;

CREATE POLICY "Members can view their salons" ON public.salons
  FOR SELECT USING (is_salon_member(id));

CREATE POLICY "Authenticated users can create salons" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update salon" ON public.salons
  FOR UPDATE USING (is_salon_owner(id));

-- ============================================================
-- SECTION 10: RLS POLICIES - SALON MEMBERS
-- ============================================================
DROP POLICY IF EXISTS "Members can view own membership" ON public.salon_members;
DROP POLICY IF EXISTS "Members can view salon colleagues" ON public.salon_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can update members" ON public.salon_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.salon_members;

CREATE POLICY "Members can view own membership" ON public.salon_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Members can view salon colleagues" ON public.salon_members
  FOR SELECT USING (is_salon_member(salon_id));

CREATE POLICY "Users can add themselves as members" ON public.salon_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update members" ON public.salon_members
  FOR UPDATE USING (is_salon_owner(salon_id));

CREATE POLICY "Owners can delete members" ON public.salon_members
  FOR DELETE USING (is_salon_owner(salon_id));

-- ============================================================
-- SECTION 11: RLS POLICIES - CUSTOMERS
-- ============================================================
DROP POLICY IF EXISTS "Users can view customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can insert customers to their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can update customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can delete customers of their salon" ON public.customer;

CREATE POLICY "Users can view customers of their salon" ON public.customer
  FOR SELECT USING (is_salon_member(salon_id));

CREATE POLICY "Users can insert customers to their salon" ON public.customer
  FOR INSERT WITH CHECK (is_salon_member(salon_id) OR salon_id IS NULL);

CREATE POLICY "Users can update customers of their salon" ON public.customer
  FOR UPDATE USING (is_salon_member(salon_id));

CREATE POLICY "Users can delete customers of their salon" ON public.customer
  FOR DELETE USING (is_salon_member(salon_id));

-- ============================================================
-- SECTION 12: TRIGGER - AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_salon_id UUID;
  salon_name TEXT;
  salon_province TEXT;
  salon_address TEXT;
  salon_phone TEXT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Check if salon info was provided during signup
  salon_name := NEW.raw_user_meta_data->>'salon_name';
  salon_province := NEW.raw_user_meta_data->>'salon_province';
  salon_address := NEW.raw_user_meta_data->>'salon_address';
  salon_phone := NEW.raw_user_meta_data->>'salon_phone';
  
  -- If salon info exists, create salon and add user as owner
  IF salon_name IS NOT NULL AND salon_name != '' THEN
    INSERT INTO public.salons (name, province, address, phone)
    VALUES (salon_name, COALESCE(salon_province, ''), COALESCE(salon_address, ''), COALESCE(salon_phone, ''))
    RETURNING id INTO new_salon_id;
    
    INSERT INTO public.salon_members (user_id, salon_id, role)
    VALUES (NEW.id, new_salon_id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 13: TRIGGER - AUTO-SET SALON_ID ON CUSTOMER INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_customer_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If salon_id is already set (e.g., from seed), keep it
  IF NEW.salon_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Auto-set salon_id from authenticated user's membership
  NEW.salon_id := get_user_salon_id();
  
  -- If no salon found and no explicit value, reject the insert
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to a salon to create customers';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_customer_salon_id_trigger ON public.customer;
CREATE TRIGGER set_customer_salon_id_trigger
  BEFORE INSERT ON public.customer
  FOR EACH ROW EXECUTE FUNCTION public.set_customer_salon_id();

-- ============================================================
-- SECTION 14: GRANTS (for authenticated users)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salon_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE customer_id_seq TO authenticated;

-- Grant for anon (limited)
GRANT SELECT ON public.customer TO anon;
GRANT USAGE, SELECT ON SEQUENCE customer_id_seq TO anon;
