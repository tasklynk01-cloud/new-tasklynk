import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { users } from './src/db/schema';
import { like, or } from 'drizzle-orm';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function findGrason() {
  try {
    const results = await db.select().from(users).where(
      or(
        like(users.email, '%grason%'),
        like(users.name, '%grason%'),
        like(users.name, '%Grason%')
      )
    );
    
    console.log('Found users:', results.map(u => ({ 
      id: u.id, 
      email: u.email, 
      name: u.name, 
      role: u.role 
    })));
    
    if (results.length === 0) {
      console.log('\nNo users found with "grason" in name or email');
      console.log('Searching for all freelancers instead...\n');
      
      const freelancers = await db.select().from(users).where(
        or(
          like(users.role, 'freelancer'),
          like(users.role, 'Freelancer')
        )
      );
      
      console.log(`Found ${freelancers.length} freelancers:`);
      freelancers.forEach(f => {
        console.log(`  - ${f.name} (${f.email})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.close();
  }
}

findGrason();
