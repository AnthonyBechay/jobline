-- Fix cancellation_settings table schema
-- This script adds all missing columns and fixes the schema

-- 1. Add missing columns with defaults
ALTER TABLE cancellation_settings 
ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb;

ALTER TABLE cancellation_settings 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';

-- 2. Update existing records with proper values
UPDATE cancellation_settings 
SET non_refundable_components = COALESCE(non_refundable_components, '[]'::jsonb);

UPDATE cancellation_settings 
SET name = CASE 
  WHEN cancellation_type = 'pre_arrival' THEN 'Pre-Arrival Cancellation'
  WHEN cancellation_type = 'pre_arrival_client' THEN 'Pre-Arrival Client Cancellation'
  WHEN cancellation_type = 'pre_arrival_candidate' THEN 'Pre-Arrival Candidate Cancellation'
  WHEN cancellation_type = 'post_arrival_within_3_months' THEN 'Post-Arrival Within 3 Months'
  WHEN cancellation_type = 'post_arrival_after_3_months' THEN 'Post-Arrival After 3 Months'
  WHEN cancellation_type = 'candidate_cancellation' THEN 'Candidate Cancellation'
  ELSE cancellation_type
END
WHERE name = '' OR name IS NULL;

-- 3. Make columns required after setting values
ALTER TABLE cancellation_settings 
ALTER COLUMN name SET NOT NULL;

-- 4. Drop any deprecated columns
ALTER TABLE cancellation_settings 
DROP COLUMN IF EXISTS deportation_cost;

ALTER TABLE cancellation_settings 
DROP COLUMN IF EXISTS non_refundable_fees;

-- 5. Show the final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cancellation_settings'
ORDER BY ordinal_position;
