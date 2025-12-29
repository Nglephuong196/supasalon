-- Migration: Add salon_id to customer table for multi-tenancy
-- Date: 2025-12-29

-- 1. Add salon_id column to customer table
ALTER TABLE public.customer 
ADD COLUMN salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE;

-- 2. Create index for faster queries
CREATE INDEX idx_customer_salon_id ON public.customer(salon_id);

-- 3. Enable RLS on customer table
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any (for idempotency)
DROP POLICY IF EXISTS "Users can view customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can insert customers to their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can update customers of their salon" ON public.customer;
DROP POLICY IF EXISTS "Users can delete customers of their salon" ON public.customer;

-- 5. RLS Policies

-- SELECT: Users can only see customers belonging to their salon
CREATE POLICY "Users can view customers of their salon" ON public.customer
  FOR SELECT USING (
    salon_id IN (
      SELECT salon_id FROM public.salon_members 
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can only add customers to their salon
CREATE POLICY "Users can insert customers to their salon" ON public.customer
  FOR INSERT WITH CHECK (
    salon_id IN (
      SELECT salon_id FROM public.salon_members 
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can only update customers of their salon
CREATE POLICY "Users can update customers of their salon" ON public.customer
  FOR UPDATE USING (
    salon_id IN (
      SELECT salon_id FROM public.salon_members 
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can only delete customers of their salon
CREATE POLICY "Users can delete customers of their salon" ON public.customer
  FOR DELETE USING (
    salon_id IN (
      SELECT salon_id FROM public.salon_members 
      WHERE user_id = auth.uid()
    )
  );

-- 6. Function to get current user's salon_id
CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS UUID AS $$
  SELECT salon_id FROM public.salon_members 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. Trigger to auto-set salon_id on customer insert
-- Only sets salon_id if not explicitly provided (allows seeding with explicit values)
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
