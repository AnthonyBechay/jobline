import { db } from '../lib/db';
import { sql } from 'drizzle-orm';

async function checkDatabase() {
  try {
    console.log('Checking database connection...');

    // Test connection
    const result = await db.execute(sql`SELECT NOW()`);
    console.log('✓ Database connected');

    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nTables in database:');
    tables.rows.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

    console.log(`\nTotal: ${tables.rows.length} tables`);

    process.exit(0);
  } catch (error) {
    console.error('Database check failed:', error);
    process.exit(1);
  }
}

checkDatabase();
