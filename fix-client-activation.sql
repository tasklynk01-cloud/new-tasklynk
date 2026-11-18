-- Fix Client Activation Status
-- This script ensures all approved clients have consistent status='active'

-- Step 1: Show current status of approved clients
SELECT 
  id, 
  name, 
  email, 
  role, 
  approved, 
  status,
  CASE 
    WHEN status = 'active' THEN '✅'
    ELSE '❌'
  END as is_active
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND approved = 1
ORDER BY id;

-- Step 2: Update all approved clients to active status
UPDATE users 
SET 
  status = 'active', 
  updated_at = datetime('now')
WHERE (role = 'client' OR role = 'account_owner') 
AND approved = 1 
AND status != 'active';

-- Step 3: Verify updates
SELECT 
  id, 
  name, 
  email, 
  role, 
  approved, 
  status,
  updated_at
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND approved = 1
ORDER BY id;

-- Step 4: Check for any conflicts
SELECT 
  id, 
  name, 
  email, 
  approved, 
  status
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND approved = 1 
AND status != 'active';

-- Step 5: Status distribution summary
SELECT 
  status, 
  COUNT(*) as count
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND approved = 1 
GROUP BY status;
