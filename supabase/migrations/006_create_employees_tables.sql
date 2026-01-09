-- ============================================================
-- SALON PRO - EMPLOYEE MANAGEMENT TABLES
-- ============================================================
-- Creates employee_groups (Nhóm) and employees tables
-- ============================================================

-- ============================================================
-- SECTION 1: EMPLOYEE GROUPS (Nhóm nhân viên)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employee_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster salon-based queries
CREATE INDEX IF NOT EXISTS idx_employee_groups_salon_id ON public.employee_groups(salon_id);

-- ============================================================
-- SECTION 2: EMPLOYEES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  group_id UUID REFERENCES public.employee_groups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  allow_booking BOOLEAN DEFAULT true,
  allow_overlap BOOLEAN DEFAULT false,
  birthday DATE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster salon-based queries
CREATE INDEX IF NOT EXISTS idx_employees_salon_id ON public.employees(salon_id);
CREATE INDEX IF NOT EXISTS idx_employees_group_id ON public.employees(group_id);

-- ============================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.employee_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 4: RLS POLICIES - EMPLOYEE GROUPS
-- Only admin and owner can VIEW, only admin and owner can MANAGE
-- ============================================================
CREATE POLICY "Only admin and owner can view employee groups" ON public.employee_groups
  FOR SELECT USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can insert employee groups" ON public.employee_groups
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can update employee groups" ON public.employee_groups
  FOR UPDATE USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can delete employee groups" ON public.employee_groups
  FOR DELETE USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

-- ============================================================
-- SECTION 5: RLS POLICIES - EMPLOYEES  
-- Only admin and owner can VIEW, only admin and owner can MANAGE
-- ============================================================
CREATE POLICY "Only admin and owner can view employees" ON public.employees
  FOR SELECT USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can insert employees" ON public.employees
  FOR INSERT WITH CHECK (
    is_system_admin()
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can update employees" ON public.employees
  FOR UPDATE USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

CREATE POLICY "Only admin and owner can delete employees" ON public.employees
  FOR DELETE USING (
    is_system_admin() 
    OR is_salon_owner(salon_id)
  );

-- ============================================================
-- SECTION 6: TRIGGER - AUTO-SET SALON_ID ON INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_employee_group_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.salon_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  NEW.salon_id := get_user_salon_id();
  
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any salon';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_employee_group_salon_id_trigger
  BEFORE INSERT ON public.employee_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_group_salon_id();

CREATE OR REPLACE FUNCTION public.set_employee_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.salon_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  NEW.salon_id := get_user_salon_id();
  
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any salon';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_employee_salon_id_trigger
  BEFORE INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_employee_salon_id();
