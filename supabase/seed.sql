-- Seed data for multi-tenant salon management
-- Run with: npx supabase db reset

-- ============================================
-- 1. Create two test users in auth.users
-- (The handle_new_user trigger auto-creates profiles)
-- ============================================
-- Password for both: Nhi@200696

INSERT INTO auth.users (
  id, 
  instance_id,
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_user_meta_data,
  created_at, 
  updated_at,
  role,
  aud
) VALUES 
-- User 1: phuong@gmail.com
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '00000000-0000-0000-0000-000000000000',
  'phuong@gmail.com',
  '$2a$10$hsAonssl0GDmC9BZaojC7.XNsfDUlpIW.j4kc2/WK8GA0eTr.pmr.', -- Generate proper bcrypt hash
  NOW(),
  '{"full_name": "Nguyễn Văn Phương", "salon_name": "Beauty Salon Phương"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
),
-- User 2: phuong2@gmail.com
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '00000000-0000-0000-0000-000000000000',
  'phuong2@gmail.com',
  '$2a$10$hsAonssl0GDmC9BZaojC7.XNsfDUlpIW.j4kc2/WK8GA0eTr.pmr.', -- Generate proper bcrypt hash
  NOW(),
  '{"full_name": "Trần Thị Phương", "salon_name": "Nail & Spa Phương"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- ============================================
-- 1b. Create auth.identities (required for login)
-- ============================================
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '{"sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "email": "phuong@gmail.com"}',
  'email',
  'phuong@gmail.com',
  NOW(),
  NOW(),
  NOW()
),
(
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  '{"sub": "b2c3d4e5-f6a7-8901-bcde-f12345678901", "email": "phuong2@gmail.com"}',
  'email',
  'phuong2@gmail.com',
  NOW(),
  NOW(),
  NOW()
);

-- ============================================
-- 2. Update profiles with phone numbers (created by trigger)
-- ============================================
UPDATE public.profiles SET phone = '0901234567' WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
UPDATE public.profiles SET phone = '0912345678' WHERE id = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

-- ============================================
-- 3. Create two salons
-- ============================================
INSERT INTO public.salons (id, name, province, address, phone) VALUES
('11111111-1111-1111-1111-111111111111', 'Beauty Salon Phương', 'TP. Hồ Chí Minh', '123 Nguyễn Huệ, Quận 1', '0901234567'),
('22222222-2222-2222-2222-222222222222', 'Nail & Spa Phương', 'Hà Nội', '456 Phố Huế, Hoàn Kiếm', '0912345678');

-- ============================================
-- 4. Link owners to their salons
-- ============================================
INSERT INTO public.salon_members (user_id, salon_id, role) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '11111111-1111-1111-1111-111111111111', 'owner'),
('b2c3d4e5-f6a7-8901-bcde-f12345678901', '22222222-2222-2222-2222-222222222222', 'owner');

-- ============================================
-- 5. Seed customers for Salon 1 (Beauty Salon Phương)
-- ============================================
INSERT INTO public.customer (salon_id, name, phone, gender, birthday, location) VALUES
-- Salon 1 customers (HCM)
('11111111-1111-1111-1111-111111111111', 'Nguyễn Thị Mai', '0901234567', 'Nữ', '1990-03-15', 'Quận 1, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Trần Văn Hùng', '0912345678', 'Nam', '1985-07-22', 'Quận 3, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Lê Thị Hương', '0923456789', 'Nữ', '1992-11-08', 'Quận 7, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Phạm Minh Tuấn', '0934567890', 'Nam', '1988-01-30', 'Quận Bình Thạnh, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Võ Thị Lan', '0945678901', 'Nữ', '1995-05-12', 'Quận 2, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Hoàng Văn Nam', '0956789012', 'Nam', '1991-09-25', 'Quận Tân Bình, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Đặng Thị Thuỷ', '0967890123', 'Nữ', '1987-12-03', 'Quận Phú Nhuận, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Bùi Quốc Việt', '0978901234', 'Nam', '1993-04-18', 'Quận Gò Vấp, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Ngô Thị Hạnh', '0989012345', 'Nữ', '1989-08-07', 'Quận 10, TP.HCM'),
('11111111-1111-1111-1111-111111111111', 'Lý Văn Đức', '0990123456', 'Nam', '1994-02-28', 'Quận 5, TP.HCM');

-- ============================================
-- 6. Seed customers for Salon 2 (Nail & Spa Phương)
-- ============================================
INSERT INTO public.customer (salon_id, name, phone, gender, birthday, location) VALUES
-- Salon 2 customers (Hanoi)
('22222222-2222-2222-2222-222222222222', 'Trương Thị Kim Ngân', '0901112233', 'Nữ', '1996-06-20', 'Ba Đình, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Nguyễn Hoàng Long', '0902223344', 'Nam', '1983-11-15', 'Hoàn Kiếm, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Phan Thị Mỹ Linh', '0903334455', 'Nữ', '1991-02-28', 'Đống Đa, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Đỗ Văn Thành', '0904445566', 'Nam', '1987-09-10', 'Hai Bà Trưng, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Huỳnh Thị Bích Phượng', '0905556677', 'Nữ', '1994-04-05', 'Cầu Giấy, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Vũ Minh Khang', '0906667788', 'Nam', '1990-12-25', 'Thanh Xuân, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Trịnh Thị Thanh Tâm', '0907778899', 'Nữ', '1988-07-18', 'Hoàng Mai, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Lâm Quốc Bảo', '0908889900', 'Nam', '1992-01-03', 'Long Biên, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Mai Thị Hồng Nhung', '0909990011', 'Nữ', '1986-08-22', 'Tây Hồ, Hà Nội'),
('22222222-2222-2222-2222-222222222222', 'Dương Văn Phúc', '0911122334', 'Nam', '1995-05-30', 'Nam Từ Liêm, Hà Nội');
