-- ============================================================
-- SALON PRO - FIX SIGNUP TRIGGER
-- ============================================================
-- Recreate the handle_new_user trigger with proper settings
-- to bypass RLS during signup
-- ============================================================

-- ============================================================
-- SECTION 1: RECREATE HANDLE_NEW_USER FUNCTION
-- ============================================================
-- Use SET search_path to ensure security and add error handling

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_salon_id UUID;
  salon_name TEXT;
  salon_province TEXT;
  salon_address TEXT;
  salon_phone TEXT;
BEGIN
  -- Create profile first (required)
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
    
    -- Add user as owner with default permissions
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

-- ============================================================
-- SECTION 2: RECREATE TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 3: GRANT EXECUTE PERMISSION
-- ============================================================
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
