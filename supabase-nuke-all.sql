-- ============================================
-- CoachSet: NUKE ALL DEMO DATA
-- This wipes EVERYTHING except the admin login
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Reset everything to empty with only the admin user
UPDATE coachset_state
SET payload = jsonb_build_object(
  'platformSettings', jsonb_build_object(
    'commissionRate', 0.15,
    'currency', 'PKR',
    'launchCities', jsonb_build_array('Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot'),
    'paymentMethods', jsonb_build_array('Bank Transfer', 'JazzCash', 'EasyPaisa'),
    'contactUnlockPolicy', 'Direct trainer contact is shown only after admin verifies payment.'
  ),
  'users', jsonb_build_array(jsonb_build_object(
    'id', 'admin-1',
    'role', 'admin',
    'name', 'Admin',
    'email', 'admin',
    'phone', '+923000000000',
    'passwordHash', 'scrypt$3602e506265e432b2650e84f489fefdc$417f2e560bc7bd7d24d0eb5246b939ff32ef6d3fcb278221b1f297c4638333f42fb6b5b880e4062362d7723f9803e3505eabe2756ccf6ae2fa27f4819a61176d',
    'status', 'active',
    'createdAt', '2026-05-15T00:00:00.000Z'
  )),
  'trainers', '[]'::jsonb,
  'trainerDocuments', '[]'::jsonb,
  'protocols', '[]'::jsonb,
  'bookings', '[]'::jsonb,
  'payments', '[]'::jsonb,
  'payouts', '[]'::jsonb,
  'leads', '[]'::jsonb,
  'reviews', '[]'::jsonb,
  'disputes', '[]'::jsonb,
  'statsEvents', '[]'::jsonb
)
WHERE id = 1;

-- Step 2: Verify it's clean
SELECT 
  jsonb_array_length(payload->'users') AS user_count,
  jsonb_array_length(payload->'trainers') AS trainer_count,
  jsonb_array_length(payload->'bookings') AS booking_count,
  jsonb_array_length(payload->'reviews') AS review_count,
  jsonb_array_length(payload->'leads') AS lead_count
FROM coachset_state
WHERE id = 1;
