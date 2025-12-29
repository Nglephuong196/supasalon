-- Migration: Create profiles, salons, and salon_members tables
-- Date: 2025-12-29

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SALONS TABLE
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

-- 3. SALON ROLE ENUM
DO $$ BEGIN
  CREATE TYPE public.salon_role AS ENUM ('owner', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. SALON MEMBERS TABLE (junction table with roles)
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

-- 5. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_members ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: Allow insert during signup
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Salons: Members can view their salons
CREATE POLICY "Members can view their salons" ON public.salons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.salon_members 
      WHERE salon_members.salon_id = salons.id 
      AND salon_members.user_id = auth.uid()
    )
  );

-- Salons: Any authenticated user can create a salon (owner signup)
CREATE POLICY "Authenticated users can create salons" ON public.salons
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Salons: Only owners can update their salon
CREATE POLICY "Owners can update salon" ON public.salons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.salon_members 
      WHERE salon_members.salon_id = salons.id 
      AND salon_members.user_id = auth.uid()
      AND salon_members.role = 'owner'
    )
  );

-- Salon Members: Users can view their own membership record
CREATE POLICY "Members can view own membership" ON public.salon_members
  FOR SELECT USING (user_id = auth.uid());

-- Salon Members: Allow insert for authenticated users (for owner signup)
CREATE POLICY "Users can add themselves as members" ON public.salon_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Salon Members: Function to check ownership (uses SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_salon_owner(check_salon_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE salon_id = check_salon_id 
    AND user_id = auth.uid() 
    AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Salon Members: Function to check membership (uses SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.is_salon_member(check_salon_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.salon_members 
    WHERE salon_id = check_salon_id 
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Salon Members: Members can view colleagues in their salon (using function)
CREATE POLICY "Members can view salon colleagues" ON public.salon_members
  FOR SELECT USING (is_salon_member(salon_id));

CREATE POLICY "Owners can update members" ON public.salon_members
  FOR UPDATE USING (is_salon_owner(salon_id));

CREATE POLICY "Owners can delete members" ON public.salon_members
  FOR DELETE USING (is_salon_owner(salon_id));

-- 7. FUNCTION TO HANDLE NEW USER SIGNUP (creates profile + salon + membership)
-- Uses SECURITY DEFINER to bypass RLS during signup
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
    -- Create the salon
    INSERT INTO public.salons (name, province, address, phone)
    VALUES (salon_name, COALESCE(salon_province, ''), COALESCE(salon_address, ''), COALESCE(salon_phone, ''))
    RETURNING id INTO new_salon_id;
    
    -- Add user as owner
    INSERT INTO public.salon_members (user_id, salon_id, role)
    VALUES (NEW.id, new_salon_id, 'owner');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

