-- ============================================
-- CoachSet: Clean fake hardcoded stats from trainers
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: See current fake fields before cleanup
SELECT 
  t->>'id' AS trainer_id,
  t->>'name' AS trainer_name,
  t->>'rating' AS fake_rating,
  t->>'reviews' AS fake_reviews,
  t->>'completedBookings' AS fake_completed,
  t->>'activeClients' AS fake_active,
  t->>'successRate' AS fake_success,
  t->>'avgFatLoss' AS fake_fatloss,
  t->>'clientRetention' AS fake_retention,
  t->>'totalRevenue' AS fake_revenue,
  t->>'activeProtocols' AS fake_protocols
FROM coachset_state,
     jsonb_array_elements(payload->'trainers') AS t
WHERE id = 1;

-- Step 2: Remove all fake vanity fields from every trainer
UPDATE coachset_state
SET payload = jsonb_set(
  payload,
  '{trainers}',
  COALESCE((
    SELECT jsonb_agg(
      trainer 
        - 'rating' 
        - 'reviews' 
        - 'completedBookings' 
        - 'activeClients'
        - 'successRate'
        - 'avgFatLoss'
        - 'clientRetention'
        - 'totalRevenue'
        - 'activeProtocols'
    )
    FROM jsonb_array_elements(payload->'trainers') AS trainer
  ), '[]'::jsonb)
)
WHERE id = 1;

-- Step 3: Verify cleanup worked (should show NULL for all fake fields)
SELECT 
  t->>'id' AS trainer_id,
  t->>'name' AS trainer_name,
  t->>'rating' AS rating_after,
  t->>'reviews' AS reviews_after,
  t->>'completedBookings' AS completed_after,
  t->>'successRate' AS success_after
FROM coachset_state,
     jsonb_array_elements(payload->'trainers') AS t
WHERE id = 1;

-- Step 4: Add real yearsExperience field to trainers that don't have it
UPDATE coachset_state
SET payload = jsonb_set(
  payload,
  '{trainers}',
  COALESCE((
    SELECT jsonb_agg(
      CASE 
        WHEN (trainer->>'yearsExperience') IS NULL THEN
          jsonb_set(trainer, '{yearsExperience}', 
            CASE trainer->>'id'
              WHEN 'zaid-ahmed' THEN '8'::jsonb
              WHEN 'sara-khan' THEN '4'::jsonb
              WHEN 'bilal-butt' THEN '2'::jsonb
              ELSE '1'::jsonb
            END
          )
        ELSE trainer
      END
    )
    FROM jsonb_array_elements(payload->'trainers') AS trainer
  ), '[]'::jsonb)
)
WHERE id = 1;
