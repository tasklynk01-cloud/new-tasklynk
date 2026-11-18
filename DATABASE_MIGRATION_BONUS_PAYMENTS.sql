-- Database Migration: Add Bonus Payment Fields to Payments Table
-- Date: December 4, 2025
-- Description: Adds bonusAmount, totalAmount fields and updates default paymentMethod to 'pesapal'

-- Step 1: Add bonus_amount column (default 0)
ALTER TABLE payments ADD COLUMN bonus_amount REAL NOT NULL DEFAULT 0;

-- Step 2: Add total_amount column (default 0)
ALTER TABLE payments ADD COLUMN total_amount REAL NOT NULL DEFAULT 0;

-- Step 3: Update existing records to calculate total_amount (amount + bonus_amount)
UPDATE payments SET total_amount = amount WHERE total_amount = 0;

-- Step 4: Optional - Update default payment method for future records (if needed)
-- Note: This doesn't change existing records, only affects new inserts
-- The default is now 'pesapal' instead of 'mpesa' as defined in schema

-- Verification Queries:
-- Check if columns were added successfully
SELECT bonus_amount, total_amount FROM payments LIMIT 5;

-- Verify all existing payments have total_amount populated
SELECT COUNT(*) as records_with_zero_total 
FROM payments 
WHERE total_amount = 0;

-- Expected result: 0 (all records should have total_amount populated)

-- Notes:
-- 1. bonus_amount is optional and defaults to 0
-- 2. total_amount = amount + bonus_amount
-- 3. Payment methods now support: 'pesapal' (primary), 'till' (secondary), 'mpesa' (legacy)
-- 4. Run this migration in Turso LibSQL via Turso CLI or Drizzle Kit
