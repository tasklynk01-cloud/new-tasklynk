/**
 * DATABASE SCHEMA FIX: Change default status from 'active' to 'pending'
 * 
 * PROBLEM:
 * Current schema has:
 *   approved: boolean DEFAULT false  ← Correct
 *   status: text DEFAULT 'active'    ← Wrong! Should be 'pending'
 * 
 * This causes new users to have inconsistent state:
 *   approved=false + status='active' = Confusing!
 * 
 * SOLUTION:
 * Change status default to 'pending' for new users
 * Update existing users to have consistent status
 */

-- Step 1: Fix existing users with inconsistent status
-- Set status='pending' for all users where approved=false AND status='active'
UPDATE users 
SET status = 'pending', 
    updatedAt = datetime('now')
WHERE approved = 0 
  AND status = 'active'
  AND status NOT IN ('suspended', 'rejected', 'blacklisted');

-- Verification query: Check how many users were affected
SELECT 
  COUNT(*) as affected_users,
  'Users with approved=false and status=active fixed' as description
FROM users 
WHERE approved = 0 AND status = 'pending';

-- Step 2: Verify all user statuses are now consistent
SELECT 
  CASE 
    WHEN approved = 1 AND status = 'active' THEN 'Correct: Active'
    WHEN approved = 0 AND status = 'pending' THEN 'Correct: Pending'
    WHEN status IN ('suspended', 'rejected', 'blacklisted') THEN 'Special: ' || status
    ELSE 'Inconsistent: approved=' || approved || ', status=' || status
  END as status_check,
  COUNT(*) as count
FROM users
GROUP BY status_check
ORDER BY count DESC;

-- Step 3: List any remaining inconsistent users
SELECT 
  id,
  displayId,
  email,
  name,
  role,
  approved,
  status,
  createdAt
FROM users
WHERE (
  (approved = 1 AND status != 'active')
  OR (approved = 0 AND status NOT IN ('pending', 'suspended', 'rejected', 'blacklisted'))
)
ORDER BY createdAt DESC;

/**
 * NOTE: The schema default cannot be changed via SQL in SQLite for existing tables.
 * To fix the schema permanently, update src/db/schema.ts:
 * 
 * OLD:
 *   status: text('status').notNull().default('active'),
 * 
 * NEW:
 *   status: text('status').notNull().default('pending'),
 * 
 * Then run: npm run db:push
 */
