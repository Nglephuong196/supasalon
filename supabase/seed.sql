-- Seed data for customer table
-- Run with: npx supabase db reset (this will apply migrations and then seed)

INSERT INTO public.customer (name, phone, gender, birthday, location) VALUES
('Nguyễn Thị Mai', '0901234567', 'Nữ', '1990-03-15', 'Quận 1, TP.HCM'),
('Trần Văn Hùng', '0912345678', 'Nam', '1985-07-22', 'Quận 3, TP.HCM'),
('Lê Thị Hương', '0923456789', 'Nữ', '1992-11-08', 'Quận 7, TP.HCM'),
('Phạm Minh Tuấn', '0934567890', 'Nam', '1988-01-30', 'Quận Bình Thạnh, TP.HCM'),
('Võ Thị Lan', '0945678901', 'Nữ', '1995-05-12', 'Quận 2, TP.HCM'),
('Hoàng Văn Nam', '0956789012', 'Nam', '1991-09-25', 'Quận Tân Bình, TP.HCM'),
('Đặng Thị Thuỷ', '0967890123', 'Nữ', '1987-12-03', 'Quận Phú Nhuận, TP.HCM'),
('Bùi Quốc Việt', '0978901234', 'Nam', '1993-04-18', 'Quận Gò Vấp, TP.HCM'),
('Ngô Thị Hạnh', '0989012345', 'Nữ', '1989-08-07', 'Quận 10, TP.HCM'),
('Lý Văn Đức', '0990123456', 'Nam', '1994-02-28', 'Quận 5, TP.HCM');
