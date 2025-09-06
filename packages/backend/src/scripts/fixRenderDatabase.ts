import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRenderDatabase() {
  console.log('🔧 Fixing Render Database Schema...\n');
  
  try {
    // Check current state
    console.log('1. Checking current database state...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'cancellation_settings'
      );
    ` as any[];
    
    if (!tableExists[0].exists) {
      console.log('   Table does not exist. Will be created by migration.');
    } else {
      // Check for missing columns
      console.log('2. Checking for missing columns...');
      
      try {
        // Try to add missing columns
        await prisma.$executeRaw`
          ALTER TABLE cancellation_settings 
          ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb;
        `;
        console.log('   ✓ Added non_refundable_components column');
      } catch (e) {
        console.log('   Column might already exist');
      }
      
      try {
        await prisma.$executeRaw`
          ALTER TABLE cancellation_settings 
          ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
        `;
        console.log('   ✓ Added name column');
      } catch (e) {
        console.log('   Column might already exist');
      }
      
      // Update existing records
      console.log('3. Updating existing records...');
      await prisma.$executeRaw`
        UPDATE cancellation_settings 
        SET non_refundable_components = '[]'::jsonb 
        WHERE non_refundable_components IS NULL;
      `;
      
      await prisma.$executeRaw`
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
      `;
      console.log('   ✓ Updated existing records');
      
      // Remove deprecated columns
      console.log('4. Removing deprecated columns...');
      try {
        await prisma.$executeRaw`
          ALTER TABLE cancellation_settings 
          DROP COLUMN IF EXISTS deportation_cost;
        `;
        console.log('   ✓ Removed deportation_cost column');
      } catch (e) {
        console.log('   Column might not exist');
      }
    }
    
    // Test the fix
    console.log('5. Testing database access...');
    const count = await prisma.cancellationSetting.count();
    console.log(`   ✓ Database is working! Found ${count} settings.`);
    
    // If no settings exist, seed defaults
    if (count === 0) {
      console.log('6. No settings found. Seeding defaults...');
      
      // Get first company
      const company = await prisma.company.findFirst();
      if (company) {
        const defaultSettings = [
          {
            cancellationType: 'pre_arrival_client',
            name: 'Pre-Arrival Client Cancellation',
            penaltyFee: 200,
            refundPercentage: 100,
            nonRefundableComponents: ['Government Fees'],
            monthlyServiceFee: 0,
            companyId: company.id,
            active: true
          },
          {
            cancellationType: 'pre_arrival_candidate',
            name: 'Pre-Arrival Candidate Cancellation',
            penaltyFee: 0,
            refundPercentage: 100,
            nonRefundableComponents: [],
            monthlyServiceFee: 0,
            companyId: company.id,
            active: true
          }
        ];
        
        for (const setting of defaultSettings) {
          await prisma.cancellationSetting.create({ data: setting });
        }
        console.log('   ✓ Added default settings');
      } else {
        console.log('   ⚠ No company found. Create a company first.');
      }
    }
    
    console.log('\n✅ Render database fixed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error fixing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly or via npm script
if (require.main === module) {
  fixRenderDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

export { fixRenderDatabase };
