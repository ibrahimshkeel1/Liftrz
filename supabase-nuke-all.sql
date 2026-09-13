-- ============================================
-- Liftrz: reset all marketplace data
-- Run in Supabase SQL Editor (dev/staging only)
-- ============================================

UPDATE Liftrz_state
SET payload = jsonb_build_object(
  'platformSettings', jsonb_build_object(
    'commissionRate', 0.15,
    'currency', 'PKR',
    'launchCities', jsonb_build_array('Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Gujranwala', 'Sialkot'),
    'paymentMethods', jsonb_build_array('Bank Transfer', 'JazzCash', 'EasyPaisa'),
    'contactUnlockPolicy', 'Direct trainer contact is shown only after admin verifies payment.'
  ),
  'users', '[]'::jsonb,
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

SELECT
  jsonb_array_length(payload->'users') AS user_count,
  jsonb_array_length(payload->'trainers') AS trainer_count,
  jsonb_array_length(payload->'bookings') AS booking_count,
  jsonb_array_length(payload->'reviews') AS review_count,
  jsonb_array_length(payload->'leads') AS lead_count
FROM Liftrz_state
WHERE id = 1;
