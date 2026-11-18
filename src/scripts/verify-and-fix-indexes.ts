import { db } from '@/db';

async function verifyAndFixIndexes() {

  try {
    // Check order_history table structure
    const orderHistoryInfo = await db.all(`PRAGMA table_info(order_history)`);
    
    // Check if jobId column exists (camelCase)
    const hasJobId = orderHistoryInfo.some((col: any) => 
      col.name === 'job_id' || col.name === 'jobId'
    );
    
    if (hasJobId) {
      const columnName = orderHistoryInfo.find((col: any) => 
        col.name === 'job_id' || col.name === 'jobId'
      )?.name;
      
      
      // Try to create the index with the correct column name
      await db.run(`CREATE INDEX IF NOT EXISTS idx_order_history_job ON order_history(${columnName})`);
    } else {
    }

    // Verify all new tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name IN ('invitations', 'writer_balances', 'order_history')
    `);
    
    
    // Verify jobs.manager_id exists
    const jobsInfo = await db.all(`PRAGMA table_info(jobs)`);
    const hasManagerId = jobsInfo.some((col: any) => 
      col.name === 'manager_id' || col.name === 'managerId'
    );
    
    // Verify manager_invitations.role and status exist
    const managerInvInfo = await db.all(`PRAGMA table_info(manager_invitations)`);
    const hasRole = managerInvInfo.some((col: any) => col.name === 'role');
    const hasStatus = managerInvInfo.some((col: any) => col.name === 'status');
    

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run the verification
verifyAndFixIndexes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

