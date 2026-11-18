import { db } from '@/db';
import { users, userStats } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
        return;
    }

    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const user of existingUsers) {
        const existingStats = await db
            .select()
            .from(userStats)
            .where(eq(userStats.userId, user.id));
        
        if (existingStats.length > 0) {
            skippedCount++;
            continue;
        }
        
        const currentTimestamp = new Date().toISOString();
        
        await db.insert(userStats).values({
            userId: user.id,
            totalJobsPosted: 0,
            totalJobsCompleted: 0,
            totalJobsCancelled: 0,
            totalAmountEarned: 0,
            totalAmountSpent: 0,
            averageRating: null,
            totalRatings: 0,
            onTimeDelivery: 0,
            lateDelivery: 0,
            revisionsRequested: 0,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
        });
        
        createdCount++;
    }
    
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});

