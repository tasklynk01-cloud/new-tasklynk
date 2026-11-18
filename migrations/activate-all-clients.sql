-- Activate all existing client accounts
-- This SQL script sets approved=1 and status='approved' for all clients and account_owners
-- Note: Valid status values are: 'pending', 'approved', 'rejected', 'suspended', 'blacklisted'

-- Show current inactive clients before update
SELECT '=== INACTIVE CLIENTS BEFORE UPDATE ===' as info;
SELECT id, email, name, role, approved, status 
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND (approved = 0 OR status != 'approved');

-- Activate all clients and account_owners
UPDATE users 
SET approved = 1, 
    status = 'approved', 
    updated_at = datetime('now')
WHERE (role = 'client' OR role = 'account_owner') 
AND (approved = 0 OR status != 'approved');

-- Show results
SELECT '=== UPDATE COMPLETE ===' as info;
SELECT 'Total clients activated: ' || changes() as result;

-- Verify all clients are now active
SELECT '=== ALL CLIENT ACCOUNTS STATUS ===' as info;
SELECT id, email, name, role, approved, status, created_at
FROM users 
WHERE (role = 'client' OR role = 'account_owner')
ORDER BY created_at DESC;

-- Summary statistics
SELECT '=== SUMMARY ===' as info;
SELECT 
  COUNT(*) as total_clients,
  SUM(CASE WHEN approved = 1 AND status = 'approved' THEN 1 ELSE 0 END) as active_clients,
  SUM(CASE WHEN approved = 0 OR status != 'approved' THEN 1 ELSE 0 END) as inactive_clients
FROM users 
WHERE role = 'client' OR role = 'account_owner';
