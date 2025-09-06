-- Only create FeeComponent table (new addition)
CREATE TABLE IF NOT EXISTS "fee_components" (
    "id" TEXT NOT NULL,
    "fee_template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_refundable" BOOLEAN NOT NULL DEFAULT true,
    "refundable_after_arrival" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_components_pkey" PRIMARY KEY ("id")
);

-- Create index for fee_components
CREATE INDEX IF NOT EXISTS "fee_components_fee_template_id_idx" ON "fee_components"("fee_template_id");

-- Add foreign key for fee_components
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'fee_components_fee_template_id_fkey') THEN
        ALTER TABLE "fee_components" ADD CONSTRAINT "fee_components_fee_template_id_fkey" 
        FOREIGN KEY ("fee_template_id") REFERENCES "fee_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
