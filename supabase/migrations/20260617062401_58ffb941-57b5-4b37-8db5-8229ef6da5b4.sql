
-- Schema additions to staff
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Seed salon
INSERT INTO public.salons (id, name, address, phone, business_hours)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Nail Lounge',
  '1513 West Lane Rd, Machesney Park, IL 61115',
  '+1 815-977-3443',
  '{"mon":{"open":"09:30","close":"19:30"},"tue":{"open":"09:30","close":"19:30"},"wed":{"open":"09:30","close":"19:30"},"thu":{"open":"09:30","close":"19:30"},"fri":{"open":"09:30","close":"19:30"},"sat":{"open":"09:30","close":"18:00"},"sun":{"open":"10:00","close":"17:00"}}'::jsonb
)
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      business_hours = EXCLUDED.business_hours;

-- Seed 4 staff
INSERT INTO public.staff (id, salon_id, name, role, title, bio, specialties, avatar_color, sort_order, working_hours, is_active)
VALUES
  ('a1111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','Jessica Moore','owner','Master Nail Artist','Founder of Nail Lounge. 12+ years sculpting precision acrylic and modern nail art.',
    ARRAY['Acrylic Sculpture','3D Nail Art','Chrome'], '#7a3b52', 1,
    '{"mon":{"open":"10:00","close":"19:00"},"tue":{"open":"10:00","close":"19:00"},"wed":{"open":"10:00","close":"19:00"},"thu":{"open":"10:00","close":"19:00"},"fri":{"open":"10:00","close":"19:00"},"sat":{"open":"10:00","close":"17:00"}}'::jsonb,
    true),
  ('a2222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Ashley Williams','staff','Gel & Dip Specialist','Known for mirror-finish gel and long-wear dip powder. Loves soft minimal looks.',
    ARRAY['Gel Manicure','Dip Powder','Ombre'], '#9b6b78', 2,
    '{"tue":{"open":"09:30","close":"18:00"},"wed":{"open":"09:30","close":"18:00"},"thu":{"open":"09:30","close":"18:00"},"fri":{"open":"09:30","close":"19:30"},"sat":{"open":"09:30","close":"18:00"},"sun":{"open":"10:00","close":"17:00"}}'::jsonb,
    true),
  ('a3333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','Sophia Brooks','staff','Pedicure & Spa Therapist','Bringing the spa experience to every pedicure — hot stones, paraffin, and the perfect heel reset.',
    ARRAY['Deluxe Pedicure','Hot Stone','Paraffin'], '#5e4b6b', 3,
    '{"mon":{"open":"09:30","close":"18:00"},"wed":{"open":"09:30","close":"19:30"},"thu":{"open":"09:30","close":"19:30"},"fri":{"open":"09:30","close":"19:30"},"sat":{"open":"09:30","close":"18:00"},"sun":{"open":"10:00","close":"17:00"}}'::jsonb,
    true),
  ('a4444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','Emily Davis','staff','Nail Art Designer','Custom freehand art, rhinestones, and full-set transformations. Ask for a consultation.',
    ARRAY['Custom Nail Art','Rhinestones','French Tip'], '#a87c5f', 4,
    '{"mon":{"open":"11:00","close":"19:30"},"tue":{"open":"11:00","close":"19:30"},"thu":{"open":"11:00","close":"19:30"},"fri":{"open":"11:00","close":"19:30"},"sat":{"open":"10:00","close":"18:00"}}'::jsonb,
    true)
ON CONFLICT (id) DO UPDATE
  SET title = EXCLUDED.title,
      bio = EXCLUDED.bio,
      specialties = EXCLUDED.specialties,
      avatar_color = EXCLUDED.avatar_color,
      sort_order = EXCLUDED.sort_order,
      working_hours = EXCLUDED.working_hours,
      role = EXCLUDED.role,
      name = EXCLUDED.name;

-- Clear & seed services
DELETE FROM public.services WHERE salon_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.services (salon_id, name, category, duration_minutes, price, deposit_amount, buffer_after_minutes)
VALUES
-- CORE NAIL SERVICES
('11111111-1111-1111-1111-111111111111','Basic Manicure','Core Nail Services',30,25,5,5),
('11111111-1111-1111-1111-111111111111','Spa Manicure','Core Nail Services',45,38,10,5),
('11111111-1111-1111-1111-111111111111','Gel Manicure','Core Nail Services',45,40,10,5),
('11111111-1111-1111-1111-111111111111','French Manicure','Core Nail Services',45,30,10,5),
('11111111-1111-1111-1111-111111111111','Deluxe Manicure','Core Nail Services',60,48,15,10),
('11111111-1111-1111-1111-111111111111','Basic Pedicure','Core Nail Services',40,38,10,10),
('11111111-1111-1111-1111-111111111111','Spa Pedicure','Core Nail Services',55,50,15,10),
('11111111-1111-1111-1111-111111111111','Gel Pedicure','Core Nail Services',60,53,15,10),
('11111111-1111-1111-1111-111111111111','French Pedicure','Core Nail Services',55,40,10,10),
('11111111-1111-1111-1111-111111111111','Deluxe Pedicure','Core Nail Services',75,58,20,10),
('11111111-1111-1111-1111-111111111111','Mani-Pedi Combo','Core Nail Services',75,45,15,10),
('11111111-1111-1111-1111-111111111111','Spa Mani-Pedi Combo','Core Nail Services',105,80,25,10),
('11111111-1111-1111-1111-111111111111','Gel Mani-Pedi Combo','Core Nail Services',105,85,25,10),
-- NAIL ENHANCEMENTS
('11111111-1111-1111-1111-111111111111','Acrylic Full Set','Nail Enhancements',75,45,15,10),
('11111111-1111-1111-1111-111111111111','Acrylic Fill-In','Nail Enhancements',60,33,10,10),
('11111111-1111-1111-1111-111111111111','Acrylic Overlay','Nail Enhancements',60,45,15,10),
('11111111-1111-1111-1111-111111111111','Pink & White Acrylic','Nail Enhancements',90,58,20,10),
('11111111-1111-1111-1111-111111111111','Pink Fill-In','Nail Enhancements',60,38,10,10),
('11111111-1111-1111-1111-111111111111','Clear Acrylic Set','Nail Enhancements',75,43,15,10),
('11111111-1111-1111-1111-111111111111','Solar Nails','Nail Enhancements',90,53,20,10),
('11111111-1111-1111-1111-111111111111','Gel Full Set','Nail Enhancements',75,55,20,10),
('11111111-1111-1111-1111-111111111111','Gel Fill-In','Nail Enhancements',60,43,15,10),
('11111111-1111-1111-1111-111111111111','Gel Overlay','Nail Enhancements',60,50,15,10),
('11111111-1111-1111-1111-111111111111','Dip Powder Full Set','Nail Enhancements',75,53,20,10),
('11111111-1111-1111-1111-111111111111','Dip Powder Fill-In','Nail Enhancements',60,43,15,10),
('11111111-1111-1111-1111-111111111111','Dip Powder Overlay','Nail Enhancements',60,50,15,10),
('11111111-1111-1111-1111-111111111111','Hybrid Nails','Nail Enhancements',75,53,20,10),
('11111111-1111-1111-1111-111111111111','Nail Extensions','Nail Enhancements',90,58,20,10),
('11111111-1111-1111-1111-111111111111','Nail Repair','Nail Enhancements',15,8,0,5),
-- SPECIALTY NAIL ART
('11111111-1111-1111-1111-111111111111','Custom Nail Art','Specialty Nail Art',30,25,10,5),
('11111111-1111-1111-1111-111111111111','French Tip Add-On','Specialty Nail Art',15,8,0,5),
('11111111-1111-1111-1111-111111111111','Chrome Nails','Specialty Nail Art',20,15,5,5),
('11111111-1111-1111-1111-111111111111','Ombre Nails','Specialty Nail Art',20,15,5,5),
('11111111-1111-1111-1111-111111111111','Glitter Nails','Specialty Nail Art',15,10,0,5),
('11111111-1111-1111-1111-111111111111','3D Nail Art','Specialty Nail Art',20,15,5,5),
('11111111-1111-1111-1111-111111111111','Rhinestone Design (per nail)','Specialty Nail Art',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Coffin Shape','Specialty Nail Art',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Almond Shape','Specialty Nail Art',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Stiletto Shape','Specialty Nail Art',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Square Shape','Specialty Nail Art',5,0,0,0),
-- HAND & FOOT CARE
('11111111-1111-1111-1111-111111111111','Paraffin Wax Treatment','Hand & Foot Care',15,8,0,5),
('11111111-1111-1111-1111-111111111111','Hot Stone Treatment','Hand & Foot Care',15,10,0,5),
('11111111-1111-1111-1111-111111111111','Callus Removal','Hand & Foot Care',15,10,0,5),
('11111111-1111-1111-1111-111111111111','Foot Scrub','Hand & Foot Care',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Heel Treatment','Hand & Foot Care',15,10,0,5),
('11111111-1111-1111-1111-111111111111','Cuticle Care','Hand & Foot Care',10,0,0,5),
('11111111-1111-1111-1111-111111111111','Nail Buffing','Hand & Foot Care',10,0,0,5),
('11111111-1111-1111-1111-111111111111','Nail Trimming','Hand & Foot Care',10,0,0,5),
('11111111-1111-1111-1111-111111111111','Polish Change Hands','Hand & Foot Care',20,13,0,5),
('11111111-1111-1111-1111-111111111111','Polish Change Feet','Hand & Foot Care',25,18,5,5),
-- WAXING SERVICES
('11111111-1111-1111-1111-111111111111','Eyebrow Waxing','Waxing Services',15,13,0,5),
('11111111-1111-1111-1111-111111111111','Lip Waxing','Waxing Services',10,10,0,5),
('11111111-1111-1111-1111-111111111111','Chin Waxing','Waxing Services',10,13,0,5),
('11111111-1111-1111-1111-111111111111','Sideburn Waxing','Waxing Services',10,13,0,5),
('11111111-1111-1111-1111-111111111111','Full Face Waxing','Waxing Services',30,30,10,5),
('11111111-1111-1111-1111-111111111111','Underarm Waxing','Waxing Services',20,20,5,5),
('11111111-1111-1111-1111-111111111111','Half Arm Waxing','Waxing Services',25,23,5,5),
('11111111-1111-1111-1111-111111111111','Full Arm Waxing','Waxing Services',35,35,10,5),
('11111111-1111-1111-1111-111111111111','Half Leg Waxing','Waxing Services',30,35,10,5),
('11111111-1111-1111-1111-111111111111','Full Leg Waxing','Waxing Services',50,53,15,10),
('11111111-1111-1111-1111-111111111111','Bikini Waxing','Waxing Services',30,43,10,5),
('11111111-1111-1111-1111-111111111111','Brazilian Waxing','Waxing Services',45,60,20,10),
('11111111-1111-1111-1111-111111111111','Back Waxing','Waxing Services',45,43,10,10),
('11111111-1111-1111-1111-111111111111','Chest Waxing','Waxing Services',45,43,10,10),
-- FACIAL SERVICES
('11111111-1111-1111-1111-111111111111','Classic Facial','Facial Services',60,55,15,10),
('11111111-1111-1111-1111-111111111111','Deep Cleansing Facial','Facial Services',75,65,20,10),
('11111111-1111-1111-1111-111111111111','Hydrating Facial','Facial Services',75,65,20,10),
('11111111-1111-1111-1111-111111111111','Brightening Facial','Facial Services',75,70,20,10),
('11111111-1111-1111-1111-111111111111','Anti-Aging Facial','Facial Services',90,78,25,10),
('11111111-1111-1111-1111-111111111111','Acne Facial','Facial Services',75,70,20,10),
('11111111-1111-1111-1111-111111111111','Express Facial','Facial Services',30,43,10,5),
('11111111-1111-1111-1111-111111111111','Facial Massage','Facial Services',20,20,5,5),
('11111111-1111-1111-1111-111111111111','Steam Treatment','Facial Services',15,15,0,5),
('11111111-1111-1111-1111-111111111111','Mask Treatment','Facial Services',20,15,5,5),
-- COMMON ADD-ONS
('11111111-1111-1111-1111-111111111111','Gel Removal','Common Add-Ons',20,18,5,5),
('11111111-1111-1111-1111-111111111111','Acrylic Removal','Common Add-Ons',25,20,5,5),
('11111111-1111-1111-1111-111111111111','Dip Removal','Common Add-Ons',20,15,5,5),
('11111111-1111-1111-1111-111111111111','Polish Upgrade','Common Add-Ons',10,8,0,5),
('11111111-1111-1111-1111-111111111111','French Design Add-On','Common Add-Ons',10,5,0,5),
('11111111-1111-1111-1111-111111111111','Nail Strengthening Treatment','Common Add-Ons',10,8,0,5),
('11111111-1111-1111-1111-111111111111','Massage Upgrade','Common Add-Ons',10,10,0,5),
('11111111-1111-1111-1111-111111111111','Extra Length','Common Add-Ons',10,5,0,5),
('11111111-1111-1111-1111-111111111111','Extra Nail Art','Common Add-Ons',10,5,0,5);
