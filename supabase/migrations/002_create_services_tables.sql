-- ============================================================
-- SECTION 1: SERVICE CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster salon-based queries
CREATE INDEX IF NOT EXISTS idx_service_categories_salon_id ON public.service_categories(salon_id);

-- ============================================================
-- SECTION 2: SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration INTEGER, -- in minutes
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  image_url TEXT,
  extra_price_config JSONB DEFAULT '[]'::jsonb, -- Store "Đơn giá phụ" configurations
  attached_products_config JSONB DEFAULT '[]'::jsonb, -- Store "Sản phẩm đi kèm" configurations
  allow_booking BOOLEAN DEFAULT FALSE,
  show_on_app BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster salon-based queries
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON public.services(salon_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

-- ============================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECTION 4: RLS POLICIES - SERVICE CATEGORIES
-- ============================================================
DROP POLICY IF EXISTS "Users can view service categories of their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can insert service categories to their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can update service categories of their salon" ON public.service_categories;
DROP POLICY IF EXISTS "Users can delete service categories of their salon" ON public.service_categories;

CREATE POLICY "Users can view service categories of their salon" ON public.service_categories
  FOR SELECT USING (is_salon_member(salon_id));

CREATE POLICY "Users can insert service categories to their salon" ON public.service_categories
  FOR INSERT WITH CHECK (is_salon_member(salon_id) OR salon_id IS NULL);

CREATE POLICY "Users can update service categories of their salon" ON public.service_categories
  FOR UPDATE USING (is_salon_member(salon_id));

CREATE POLICY "Users can delete service categories of their salon" ON public.service_categories
  FOR DELETE USING (is_salon_member(salon_id));

-- ============================================================
-- SECTION 5: RLS POLICIES - SERVICES
-- ============================================================
DROP POLICY IF EXISTS "Users can view services of their salon" ON public.services;
DROP POLICY IF EXISTS "Users can insert services to their salon" ON public.services;
DROP POLICY IF EXISTS "Users can update services of their salon" ON public.services;
DROP POLICY IF EXISTS "Users can delete services of their salon" ON public.services;

CREATE POLICY "Users can view services of their salon" ON public.services
  FOR SELECT USING (is_salon_member(salon_id));

CREATE POLICY "Users can insert services to their salon" ON public.services
  FOR INSERT WITH CHECK (is_salon_member(salon_id) OR salon_id IS NULL);

CREATE POLICY "Users can update services of their salon" ON public.services
  FOR UPDATE USING (is_salon_member(salon_id));

CREATE POLICY "Users can delete services of their salon" ON public.services
  FOR DELETE USING (is_salon_member(salon_id));

-- ============================================================
-- SECTION 6: TRIGGER - AUTO-SET SALON_ID
-- ============================================================

-- Re-use public.get_user_salon_id() from Section 7 of initial schema

-- Trigger for service_categories
CREATE OR REPLACE FUNCTION public.set_service_category_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.salon_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  NEW.salon_id := get_user_salon_id();
  
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to a salon to create service categories';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_service_category_salon_id_trigger ON public.service_categories;
CREATE TRIGGER set_service_category_salon_id_trigger
  BEFORE INSERT ON public.service_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_service_category_salon_id();


-- Trigger for services
CREATE OR REPLACE FUNCTION public.set_service_salon_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.salon_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  NEW.salon_id := get_user_salon_id();
  
  IF NEW.salon_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to a salon to create services';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_service_salon_id_trigger ON public.services;
CREATE TRIGGER set_service_salon_id_trigger
  BEFORE INSERT ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_service_salon_id();

-- ============================================================
-- SECTION 7: GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

-- Allow anon access just for viewing services (if needed for public booking later)
-- GRANT SELECT ON public.services TO anon;
