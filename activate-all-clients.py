#!/usr/bin/env python3
"""
Script to activate all existing client accounts
Sets approved=True and status='active' for all clients and account_owners
"""

import os
import sys
import subprocess

def run_sql_migration():
    """Run the SQL migration to activate clients"""
    
    turso_url = os.getenv('TURSO_CONNECTION_URL')
    turso_token = os.getenv('TURSO_AUTH_TOKEN')
    
    if not turso_url or not turso_token:
        print("❌ Error: TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN environment variables are required")
        print("Please set them in your .env file")
        sys.exit(1)
    
    print("🔍 Starting client activation process...\n")
    
    # SQL commands to execute
    sql_commands = """
-- Show current inactive clients
SELECT '=== INACTIVE CLIENTS BEFORE UPDATE ===' as info;
SELECT id, email, name, role, approved, status 
FROM users 
WHERE (role = 'client' OR role = 'account_owner') 
AND (approved = 0 OR status != 'active');

-- Activate all clients
UPDATE users 
SET approved = 1, 
    status = 'active', 
    updated_at = datetime('now')
WHERE (role = 'client' OR role = 'account_owner') 
AND (approved = 0 OR status != 'active');

-- Show all clients after update
SELECT '=== ALL CLIENTS AFTER UPDATE ===' as info;
SELECT id, email, name, role, approved, status
FROM users 
WHERE role = 'client' OR role = 'account_owner'
ORDER BY created_at DESC;
"""
    
    print("📋 SQL Migration Content:")
    print("=" * 60)
    print(sql_commands)
    print("=" * 60)
    print("\n🎯 Instructions to Activate Clients:\n")
    print("Since we cannot execute SQL directly, please follow these steps:\n")
    print("1. Go to Turso Dashboard: https://turso.tech/dashboard")
    print("2. Select your database")
    print("3. Click 'SQL Console' or 'Shell'")
    print("4. Copy and paste the SQL above")
    print("5. Click 'Execute' or 'Run'\n")
    print("This will activate all existing client accounts.\n")
    print("✅ After running, all clients will be able to:")
    print("   • Login immediately")
    print("   • Place orders")
    print("   • Access all features\n")

if __name__ == "__main__":
    run_sql_migration()
