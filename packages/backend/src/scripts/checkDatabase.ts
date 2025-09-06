import { prisma } from '../index';

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check cancellation settings
    console.log('📋 Cancellation Settings:');
    console.log('------------------------');
    const settings = await prisma.cancellationSetting.findMany();
    
    if (settings.length === 0) {
      console.log('No cancellation settings found in database.\n');
    } else {
      settings.forEach(setting => {
        console.log(`ID: ${setting.id}`);
        console.log(`Type: ${setting.cancellationType}`);
        console.log(`Name: ${setting.name || 'NOT SET (THIS IS THE PROBLEM)'}`);
        console.log(`Company: ${setting.companyId}`);
        console.log('---');
      });
    }

    // Check if there are any companies
    console.log('\n📋 Companies:');
    console.log('------------------------');
    const companies = await prisma.company.findMany({
      select: { id: true, name: true }
    });
    
    if (companies.length === 0) {
      console.log('No companies found. You need to set up a company first.\n');
    } else {
      companies.forEach(company => {
        console.log(`${company.name} (${company.id})`);
      });
    }

    // Check database schema
    console.log('\n📋 Database Schema Check:');
    console.log('------------------------');
    try {
      // Try to query with name field
      const testQuery = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'cancellation_settings' 
        AND column_name IN ('name', 'deportation_cost')
      `;
      console.log('Schema columns:', testQuery);
    } catch (error) {
      console.log('Could not check schema:', error);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabaseState()
    .then(() => {
      console.log('\n✅ Database check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database check failed:', error);
      process.exit(1);
    });
}

export { checkDatabaseState };
