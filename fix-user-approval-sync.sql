-- Fix User Approval Status Synchronization
-- This script ensures approved and status fields are in sync

-- Problem: Some users have status='active' but approved=false
-- Solution: Update approved=true for all users with status='active' or status='approved'

-- Step 1: Show current mismatches
SELECT 
    id,
    email,
    name,
    role,
    approved,
    status,
    CASE 
        WHEN approved = 0 AND (status = 'active' OR status = 'approved') THEN 'MISMATCH: approved=false but status=active/approved'
        WHEN approved = 1 AND status = 'pending' THEN 'MISMATCH: approved=true but status=pending'
        ELSE 'OK'
    END as sync_status
FROM users
WHERE 
    (approved = 0 AND (status = 'active' OR status = 'approved'))
    OR
    (approved = 1 AND status = 'pending');

-- Step 2: Fix mismatches - Set approved=true for active/approved users
UPDATE users
SET 
    approved = 1,
    updated_at = datetime('now')
WHERE 
    approved = 0 
    AND (status = 'active' OR status = 'approved');

-- Step 3: Fix reverse mismatches - Set status='active' for approved users
UPDATE users
SET 
    status = 'active',
    updated_at = datetime('now')
WHERE 
    approved = 1 
    AND status = 'pending';

-- Step 4: Verify all users are now in sync
SELECT 
    id,
    email,
    name,
    role,
    approved,
    status,
    CASE 
        WHEN approved = 1 AND (status = 'active' OR status = 'approved') THEN '✅ SYNCED'
        WHEN approved = 0 AND status = 'pending' THEN '✅ SYNCED (pending)'
        ELSE '❌ STILL MISMATCHED'
    END as sync_status
FROM users
ORDER BY id;

-- Step 5: Show summary
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Approved Users (approved=1)',
    COUNT(*)
FROM users
WHERE approved = 1
UNION ALL
SELECT 
    'Active Status Users (status=active/approved)',
    COUNT(*)
FROM users
WHERE status IN ('active', 'approved')
UNION ALL
SELECT 
    'Pending Users (status=pending)',
    COUNT(*)
FROM users
WHERE status = 'pending'
UNION ALL
SELECT 
    'Mismatched Users',
    COUNT(*)
FROM users
WHERE 
    (approved = 0 AND (status = 'active' OR status = 'approved'))
    OR
    (approved = 1 AND status = 'pending');
