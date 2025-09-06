-- First, add the column as nullable
ALTER TABLE "cancellation_settings" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Update existing rows with default names based on their cancellation type
UPDATE "cancellation_settings" 
SET "name" = 
  CASE 
    WHEN "cancellation_type" = 'pre_arrival' THEN 'Pre-Arrival Cancellation'
    WHEN "cancellation_type" = 'pre_arrival_client' THEN 'Pre-Arrival Client Cancellation'
    WHEN "cancellation_type" = 'pre_arrival_candidate' THEN 'Pre-Arrival Candidate Cancellation'
    WHEN "cancellation_type" = 'post_arrival_within_3_months' THEN 'Post-Arrival Within 3 Months'
    WHEN "cancellation_type" = 'post_arrival_after_3_months' THEN 'Post-Arrival After 3 Months'
    WHEN "cancellation_type" = 'candidate_cancellation' THEN 'Candidate Cancellation'
    ELSE "cancellation_type"
  END
WHERE "name" IS NULL;

-- Now make the column required
ALTER TABLE "cancellation_settings" ALTER COLUMN "name" SET NOT NULL;

-- Drop the deportation_cost column if it exists
ALTER TABLE "cancellation_settings" DROP COLUMN IF EXISTS "deportation_cost";
