import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function checkRatingsTable() {
  try {
    console.log('Checking ratings table...\n');

    // Check if ratings table exists
    const tables = await db.all(sql`
      SELECT name FROM sqlite_master WHERE type='table' AND name='ratings';
    `);

    console.log('Ratings table exists:', tables.length > 0);

    if (tables.length > 0) {
      // Check columns in ratings table
      const columns = await db.all(sql`PRAGMA table_info(ratings);`);
      console.log('\nRatings table columns:');
      console.table(columns);
    } else {
      console.log('\n❌ Ratings table does not exist in database!');
      console.log('You need to run: npm run db:push');
    }

    // Also check jobs table for rating-related columns
    const jobColumns = await db.all(sql`PRAGMA table_info(jobs);`);
    const ratingColumns = jobColumns.filter((col: any) => 
      col.name.toLowerCase().includes('rating') || 
      col.name.toLowerCase().includes('review')
    );
    
    console.log('\nJobs table rating-related columns:');
    console.table(ratingColumns);

  } catch (error) {
    console.error('Error checking ratings table:', error);
  } finally {
    process.exit(0);
  }
}

checkRatingsTable();
