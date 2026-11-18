-- Fix User Approval Status Synchronization
-- This SQL script ensures approved field and status field are synchronized

-- Update all approved users to have status='active' (except suspended/rejected)
UPDATE users 
SET status = 'active', updatedAt = datetime('now')
WHERE approved = 1 
  AND status NOT IN ('suspended', 'rejected')
  AND status != 'active';

-- Update all unapproved users to have status='pending' (except suspended/rejected)
UPDATE users 
SET status = 'pending', updatedAt = datetime('now')
WHERE approved = 0 
  AND status NOT IN ('suspended', 'rejected')
  AND status != 'pending';

-- Show summary of user statuses after fix
SELECT 
  role,
  approved,
  status,
  COUNT(*) as count
FROM users
GROUP BY role, approved, status
ORDER BY role, approved, status;
