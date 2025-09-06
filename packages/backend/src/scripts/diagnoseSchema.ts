import { prisma } from '../index';

async function diagnoseSchema() {
  console.log('🔍 DATABASE SCHEMA DIAGNOSTIC\n');
  console.log('=' .repeat(60));

  try {
    // 1. Check what columns actually exist in the database
    console.log('\n📊 ACTUAL DATABASE COLUMNS:');
    console.log('-' .repeat(40));
    
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'cancellation_settings'
      ORDER BY ordinal_position
    ` as any[];
    
    if (columns.length === 0) {
      console.log('❌ Table cancellation_settings does not exist!');
    } else {
      columns.forEach((col: any) => {
        console.log(`  ${col.column_name}:`);
        console.log(`    Type: ${col.data_type}`);
        console.log(`    Nullable: ${col.is_nullable}`);
        console.log(`    Default: ${col.column_default || 'none'}`);
      });
    }

    // 2. List expected columns from Prisma schema
    console.log('\n📋 EXPECTED PRISMA SCHEMA COLUMNS:');
    console.log('-' .repeat(40));
    console.log('  id (String)');
    console.log('  cancellation_type (String)');
    console.log('  name (String) - REQUIRED');
    console.log('  penalty_fee (Decimal)');
    console.log('  refund_percentage (Decimal)');
    console.log('  non_refundable_components (Json) - REQUIRED');
    console.log('  monthly_service_fee (Decimal)');
    console.log('  max_refund_amount (Decimal?)');
    console.log('  description (String?)');
    console.log('  active (Boolean)');
    console.log('  company_id (String)');
    console.log('  created_at (DateTime)');
    console.log('  updated_at (DateTime)');

    // 3. Check for missing columns
    console.log('\n⚠️ SCHEMA ISSUES:');
    console.log('-' .repeat(40));
    
    const columnNames = columns.map((c: any) => c.column_name);
    const requiredColumns = [
      'id', 'cancellation_type', 'name', 'penalty_fee', 
      'refund_percentage', 'non_refundable_components', 
      'monthly_service_fee', 'company_id'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ MISSING COLUMNS:');
      missingColumns.forEach(col => {
        console.log(`   - ${col}`);
      });
    } else {
      console.log('✅ All required columns exist');
    }

    // 4. Check for deprecated columns
    const deprecatedColumns = ['deportation_cost', 'non_refundable_fees'];
    const existingDeprecated = deprecatedColumns.filter(col => columnNames.includes(col));
    
    if (existingDeprecated.length > 0) {
      console.log('\n⚠️ DEPRECATED COLUMNS (should be removed):');
      existingDeprecated.forEach(col => {
        console.log(`   - ${col}`);
      });
    }

    // 5. Try to query the table
    console.log('\n🔍 ATTEMPTING TO QUERY TABLE:');
    console.log('-' .repeat(40));
    
    try {
      const count = await prisma.cancellationSetting.count();
      console.log(`✅ Query successful! Found ${count} records.`);
    } catch (queryError: any) {
      console.log(`❌ Query failed: ${queryError.message}`);
      
      if (queryError.code === 'P2022') {
        console.log('\n🔧 FIX REQUIRED:');
        console.log('The database schema doesn\'t match Prisma schema.');
        console.log('Run: .\\FORCE-SYNC-DATABASE.bat to fix this.');
      }
    }

  } catch (error: any) {
    console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
  } finally {
    console.log('\n' + '=' .repeat(60));
    console.log('DIAGNOSTIC COMPLETE\n');
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Diagnostic failed:', error);
      process.exit(1);
    });
}

export { diagnoseSchema };
