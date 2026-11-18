# 🚀 MANUAL TURSO DATABASE SETUP

Run these commands directly in your Turso database to add missing schema fields.

---

## Option 1: Using Turso CLI

```bash
# Connect to your database
turso db shell tasklynk-academic-space

# Then paste these commands one by one:
```

```sql
-- Add timestamp fields
ALTER TABLE jobs ADD COLUMN accepted_at TEXT;
ALTER TABLE jobs ADD COLUMN assigned_at TEXT;
ALTER TABLE jobs ADD COLUMN submitted_at TEXT;
ALTER TABLE jobs ADD COLUMN delivered_at TEXT;
ALTER TABLE jobs ADD COLUMN approved_at TEXT;
ALTER TABLE jobs ADD COLUMN paid_at TEXT;
ALTER TABLE jobs ADD COLUMN completed_at TEXT;

-- Add freelancer tracking fields
ALTER TABLE jobs ADD COLUMN freelancer_accepted INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN freelancer_accepted_at TEXT;
ALTER TABLE jobs ADD COLUMN freelancer_rejected INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN freelancer_rejected_at TEXT;
ALTER TABLE jobs ADD COLUMN freelancer_response_pending INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN final_submission_complete INTEGER DEFAULT 0;
```

---

## Option 2: Using Turso Dashboard

1. Go to https://turso.tech/app
2. Select your database
3. Click on "SQL Console" or "Query Editor"
4. Copy and paste the SQL from `add-missing-schema-fields.sql`
5. Click "Run" or "Execute"

---

## Option 3: Using the Migration Script (Already Has These)

The migration script `scripts/run-order-flow-migration.ts` already includes these fields, but you can run it again to ensure they're added:

```bash
npx tsx scripts/run-order-flow-migration.ts
```

The script is idempotent (safe to run multiple times).

---

## Verify Installation

After running the SQL, verify the columns were added:

```sql
PRAGMA table_info(jobs);
```

You should see these new columns in the output:
- ✅ accepted_at
- ✅ assigned_at
- ✅ submitted_at
- ✅ delivered_at
- ✅ approved_at
- ✅ paid_at
- ✅ completed_at
- ✅ freelancer_accepted
- ✅ freelancer_accepted_at
- ✅ freelancer_rejected
- ✅ freelancer_rejected_at
- ✅ freelancer_response_pending
- ✅ final_submission_complete

---

## Check If Fields Already Exist

Before adding, you can check which fields already exist:

```sql
SELECT 
  name 
FROM 
  pragma_table_info('jobs') 
WHERE 
  name IN (
    'accepted_at',
    'assigned_at',
    'submitted_at',
    'delivered_at',
    'approved_at',
    'paid_at',
    'completed_at',
    'freelancer_accepted',
    'freelancer_accepted_at',
    'freelancer_rejected',
    'freelancer_rejected_at',
    'freelancer_response_pending',
    'final_submission_complete'
  );
```

---

## Troubleshooting

### Error: "duplicate column name"
This means the column already exists. You can skip that particular ALTER TABLE statement.

### Error: "no such table: jobs"
Make sure you're connected to the correct database.

### Fields not showing up in TypeScript
After adding the fields to Turso, you need to update your local TypeScript schema file:

1. Open `src/db/schema.ts`
2. Add the fields to the `jobs` table definition (see below)

---

## Update TypeScript Schema (After SQL Changes)

After adding fields to Turso, update your `src/db/schema.ts`:

```typescript
// In the jobs table definition, add:

// Timestamp fields
acceptedAt: text('accepted_at'),
assignedAt: text('assigned_at'),
submittedAt: text('submitted_at'),
deliveredAt: text('delivered_at'),
approvedAt: text('approved_at'),
paidAt: text('paid_at'),
completedAt: text('completed_at'),

// Freelancer tracking
freelancerAccepted: integer('freelancer_accepted', { mode: 'boolean' }).default(false),
freelancerAcceptedAt: text('freelancer_accepted_at'),
freelancerRejected: integer('freelancer_rejected', { mode: 'boolean' }).default(false),
freelancerRejectedAt: text('freelancer_rejected_at'),
freelancerResponsePending: integer('freelancer_response_pending', { mode: 'boolean' }).default(false),
finalSubmissionComplete: integer('final_submission_complete', { mode: 'boolean' }).default(false),
```

Then run:
```bash
npm run db:generate  # Generate new types
```

---

## Quick Test

After adding the fields, test with a simple query:

```sql
SELECT 
  id,
  status,
  accepted_at,
  assigned_at,
  freelancer_response_pending
FROM 
  jobs
LIMIT 5;
```

If the query runs without errors, you're good to go! ✅

---

**Last Updated:** November 27, 2025
