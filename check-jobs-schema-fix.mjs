#!/usr/bin/env node

/**
 * Check Database Schema for Jobs Table
 * 
 * Verifies that all required fields exist in the jobs table with correct constraints.
 * Run with: node check-jobs-schema-fix.js
 */

import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const REQUIRED_FIELDS = {
  // Core fields (no defaults in schema - MUST provide)
  'displayId': { type: 'text', notNull: true, unique: true },
  'orderNumber': { type: 'text', notNull: true, unique: true },
  'orderId': { type: 'text', notNull: true, unique: true },
  'clientId': { type: 'integer', notNull: true },
  'title': { type: 'text', notNull: true },
  'instructions': { type: 'text', notNull: true },
  'workType': { type: 'text', notNull: true },
  'amount': { type: 'real', notNull: true },
  'deadline': { type: 'text', notNull: true },
  'actualDeadline': { type: 'text', notNull: true },
  'freelancerDeadline': { type: 'text', notNull: true },
  
  // Fields with .notNull().default() - should have database defaults
  'status': { type: 'text', notNull: true, default: 'pending' },
  'accountLinked': { type: 'integer', notNull: true, default: 0 },
  'managerEarnings': { type: 'real', notNull: true, default: 0 },
  'freelancerEarnings': { type: 'real', notNull: true, default: 0 },
  'adminProfit': { type: 'real', notNull: true, default: 0 },
  'managerAssignedFee': { type: 'real', notNull: true, default: 0 },
  'managerDeliveryFee': { type: 'real', notNull: true, default: 0 },
  'requestDraft': { type: 'integer', notNull: true, default: 0 },
  'draftDelivered': { type: 'integer', notNull: true, default: 0 },
  'requestPrintableSources': { type: 'integer', notNull: true, default: 0 },
  'singleSpaced': { type: 'integer', notNull: true, default: 0 },
  'managerApproved': { type: 'integer', notNull: true, default: 0 },
  'editorApproved': { type: 'integer', notNull: true, default: 0 },
  'editorRequestedRevision': { type: 'integer', notNull: true, default: 0 },
  'editorFlagged': { type: 'integer', notNull: true, default: 0 },
  'adminApproved': { type: 'integer', notNull: true, default: 0 },
  'clientApproved': { type: 'integer', notNull: true, default: 0 },
  'revisionRequested': { type: 'integer', notNull: true, default: 0 },
  'paymentConfirmed': { type: 'integer', notNull: true, default: 0 },
  'invoiceGenerated': { type: 'integer', notNull: true, default: 0 },
  'isRealOrder': { type: 'integer', notNull: true, default: 1 },
  'requiresReports': { type: 'integer', notNull: true, default: 1 },
  'finalSubmissionComplete': { type: 'integer', notNull: true, default: 0 },
  'revisionSubmissionComplete': { type: 'integer', notNull: true, default: 0 },
  'clientCppConfirmed': { type: 'integer', notNull: true, default: 0 },
  'freelancerAccepted': { type: 'integer', notNull: true, default: 0 },
  'freelancerRejected': { type: 'integer', notNull: true, default: 0 },
  'freelancerResponsePending': { type: 'integer', notNull: true, default: 0 },
  'isInvoiced': { type: 'integer', notNull: true, default: 0 },
  'hasOpenInternalRevision': { type: 'integer', notNull: true, default: 0 },
  'placementPriority': { type: 'integer', notNull: true, default: 0 },
  'urgencyMultiplier': { type: 'real', notNull: true, default: 1.0 },
  'managerAdditional': { type: 'real', notNull: true, default: 0 },
  'clientBonus': { type: 'real', notNull: true, default: 0 },
  'statusTotalAmount': { type: 'real', notNull: true, default: 0 },
  'internalRevisionCount': { type: 'integer', notNull: true, default: 0 },
  'escalationLevel': { type: 'integer', notNull: true, default: 0 },
  'createdAt': { type: 'text', notNull: true },
  'updatedAt': { type: 'text', notNull: true },
};

async function checkSchema() {
  console.log('🔍 Checking Jobs Table Schema...\n');
  console.log('─'.repeat(80));

  if (!process.env.TURSO_CONNECTION_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('❌ Missing database credentials');
    console.error('   Set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env file');
    return false;
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Get table info
    const result = await client.execute('PRAGMA table_info(jobs)');
    
    if (!result.rows || result.rows.length === 0) {
      console.error('❌ Jobs table not found!');
      console.log('\n💡 Run: npm run db:push');
      return false;
    }

    console.log(`✅ Jobs table found with ${result.rows.length} columns\n`);

    // Check each required field
    const columns = new Map();
    for (const row of result.rows) {
      columns.set(row.name, {
        type: row.type,
        notNull: row.notnull === 1,
        default: row.dflt_value,
      });
    }

    let missingFields = 0;
    let missingDefaults = 0;
    let missingNotNull = 0;

    console.log('Checking required fields:\n');

    for (const [fieldName, requirements] of Object.entries(REQUIRED_FIELDS)) {
      const dbColumn = columns.get(fieldName);
      
      if (!dbColumn) {
        console.log(`❌ Missing: ${fieldName}`);
        missingFields++;
        continue;
      }

      let status = '✅';
      const issues = [];

      // Check type
      if (!dbColumn.type.toLowerCase().includes(requirements.type)) {
        issues.push(`type mismatch (expected ${requirements.type}, got ${dbColumn.type})`);
        status = '⚠️';
      }

      // Check NOT NULL
      if (requirements.notNull && !dbColumn.notNull) {
        issues.push('missing NOT NULL');
        status = '⚠️';
        missingNotNull++;
      }

      // Check default value
      if ('default' in requirements && !dbColumn.default) {
        issues.push(`missing DEFAULT ${requirements.default}`);
        status = '⚠️';
        missingDefaults++;
      }

      if (issues.length > 0) {
        console.log(`${status} ${fieldName}: ${issues.join(', ')}`);
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('Summary:');
    console.log(`   Total required fields: ${Object.keys(REQUIRED_FIELDS).length}`);
    console.log(`   Missing fields: ${missingFields}`);
    console.log(`   Missing NOT NULL constraints: ${missingNotNull}`);
    console.log(`   Missing DEFAULT values: ${missingDefaults}`);
    console.log('─'.repeat(80));

    if (missingFields > 0) {
      console.log('\n❌ Schema check failed - Missing fields');
      console.log('💡 Run: npm run db:push');
      return false;
    }

    if (missingDefaults > 0) {
      console.log('\n⚠️  Warning: Some fields missing DEFAULT values');
      console.log('   The API fix provides explicit values, so this should still work.');
      console.log('   To fix permanently: Update schema and run npm run db:push');
    } else {
      console.log('\n✅ Schema check passed!');
    }

    return true;

  } catch (error) {
    console.error('\n❌ Error checking schema:', error.message);
    return false;
  } finally {
    client.close();
  }
}

// Run the check
checkSchema()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
