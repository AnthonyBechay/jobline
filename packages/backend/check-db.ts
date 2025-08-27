import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('================================');
  console.log('Database Connection Test');
  console.log('================================\n');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful!\n');
    
    // Check if tables exist
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    
    console.log('📊 Database Statistics:');
    console.log(`  - Companies: ${companyCount}`);
    console.log(`  - Users: ${userCount}`);
    
    if (companyCount === 0) {
      console.log('\n📝 No companies found. You can create your first office at:');
      console.log('   http://localhost:5173/register');
    } else {
      // List companies
      const companies = await prisma.company.findMany({
        include: {
          _count: {
            select: {
              users: true,
              applications: true,
              clients: true,
              candidates: true,
            }
          }
        }
      });
      
      console.log('\n📋 Registered Companies:');
      companies.forEach(company => {
        console.log(`\n  Company: ${company.name}`);
        console.log(`    - Users: ${company._count.users}`);
        console.log(`    - Applications: ${company._count.applications}`);
        console.log(`    - Clients: ${company._count.clients}`);
        console.log(`    - Candidates: ${company._count.candidates}`);
      });
    }
    
    console.log('\n✅ Database is ready for use!');
    
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('\nError:', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n🔧 Solution: Make sure PostgreSQL is running');
      console.error('   - Check if PostgreSQL service is started');
      console.error('   - Verify DATABASE_URL in .env file');
    } else if (error.code === 'P1002') {
      console.error('\n🔧 Solution: Database server timed out');
      console.error('   - Check your database connection string');
      console.error('   - Ensure the database server is accessible');
    } else if (error.code === 'P1003') {
      console.error('\n🔧 Solution: Database does not exist');
      console.error('   - Create the database first');
      console.error('   - Run: npx prisma migrate dev');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabase().catch(console.error);
