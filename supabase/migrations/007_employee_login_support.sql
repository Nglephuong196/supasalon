-- ============================================================
-- SALON PRO - EMPLOYEE LOGIN SUPPORT
-- ============================================================
-- Add email and user_id to employees table
-- Create trigger to link employee to salon_members when they sign up
-- ============================================================

-- ============================================================
-- SECTION 1: ADD EMAIL AND USER_ID TO EMPLOYEES
-- ============================================================
ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);

-- ============================================================
-- SECTION 2: UPDATE SIGNUP TRIGGER TO CHECK FOR EMPLOYEE RECORD
-- ============================================================
-- When a user signs up, check if their email matches an employee record
-- If so, link them and add them to salon_members

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_salon_id UUID;
  salon_name TEXT;
  salon_province TEXT;
  salon_address TEXT;
  salon_phone TEXT;
  employee_record RECORD;
BEGIN
  -- Create profile first (required)
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  -- Check if this email matches an existing employee
  SELECT * INTO employee_record
  FROM public.employees
  WHERE email = NEW.email AND user_id IS NULL;
  
  IF FOUND THEN
    -- Link user to employee record
    UPDATE public.employees
    SET user_id = NEW.id
    WHERE id = employee_record.id;
    
    -- Add user as salon member with employee role
    -- Give them default permissions for customers and bookings
    INSERT INTO public.salon_members (user_id, salon_id, role, permissions)
    VALUES (
      NEW.id, 
      employee_record.salon_id, 
      'employee',
      jsonb_build_object(
        'customers', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'services', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'bookings', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', false),
        'products', jsonb_build_object('create', false, 'read', true, 'update', false, 'delete', false),
        'employees', jsonb_build_object('create', false, 'read', false, 'update', false, 'delete', false)
      )
    );
    
    RETURN NEW;
  END IF;
  
  -- Check if salon info was provided during signup (new owner)
  salon_name := NEW.raw_user_meta_data->>'salon_name';
  salon_province := NEW.raw_user_meta_data->>'salon_province';
  salon_address := NEW.raw_user_meta_data->>'salon_address';
  salon_phone := NEW.raw_user_meta_data->>'salon_phone';
  
  -- If salon info exists, create salon and add user as owner
  IF salon_name IS NOT NULL AND salon_name != '' THEN
    INSERT INTO public.salons (name, province, address, phone)
    VALUES (salon_name, COALESCE(salon_province, ''), COALESCE(salon_address, ''), COALESCE(salon_phone, ''))
    RETURNING id INTO new_salon_id;
    
    -- Add user as owner with full permissions
    INSERT INTO public.salon_members (user_id, salon_id, role, permissions)
    VALUES (
      NEW.id, 
      new_salon_id, 
      'owner',
      jsonb_build_object(
        'customers', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'services', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'bookings', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'products', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true),
        'employees', jsonb_build_object('create', true, 'read', true, 'update', true, 'delete', true)
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
