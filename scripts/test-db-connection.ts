#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 * 
 * Tests database connectivity and performs basic queries
 * to ensure the database is properly configured and accessible.
 * 
 * Usage: npx tsx scripts/test-db-connection.ts
 */

import { db } from '../src/db';
import { users, jobs, payments, orderFiles, bids } from '../src/db/schema';
import { count, sql } from 'drizzle-orm';

async function testDatabaseConnection() {
  console.log('🔍 TaskLynk Database Connection Test\n');
  console.log('=' .repeat(60));
  console.log('');

  const startTime = Date.now();
  let allPassed = true;

  try {
    // Test 1: Basic connection (use a simple count query instead of execute)
    console.log('📡 Test 1: Basic Connection');
    console.log('-'.repeat(60));
    try {
      const connectionStart = Date.now();
      // Use a simple query to test connection
      await db.select({ count: sql<number>`1` }).from(users).limit(1);
      const connectionTime = Date.now() - connectionStart;
      console.log(`✅ Connection successful (${connectionTime}ms)`);
      console.log('');
    } catch (error) {
      console.error('❌ Connection failed:', error);
      allPassed = false;
      console.log('');
      throw error;
    }

    // Test 2: Environment variables
    console.log('🔐 Test 2: Environment Configuration');
    console.log('-'.repeat(60));
    const hasUrl = !!process.env.TURSO_CONNECTION_URL;
    const hasToken = !!process.env.TURSO_AUTH_TOKEN;
    console.log(`TURSO_CONNECTION_URL: ${hasUrl ? '✅ Set' : '❌ Missing'}`);
    console.log(`TURSO_AUTH_TOKEN: ${hasToken ? '✅ Set' : '❌ Missing'}`);
    if (!hasUrl || !hasToken) {
      console.log('⚠️  Warning: Missing required environment variables');
      allPassed = false;
    }
    console.log('');

    // Test 3: Users table
    console.log('👥 Test 3: Users Table');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const userCountResult = await db.select({ count: count() }).from(users);
      const userCount = userCountResult[0]?.count || 0;
      const queryTime = Date.now() - queryStart;
      console.log(`✅ Users table accessible`);
      console.log(`   Total users: ${userCount}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Users table query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Test 4: Jobs table
    console.log('📋 Test 4: Jobs Table');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const jobCountResult = await db.select({ count: count() }).from(jobs);
      const jobCount = jobCountResult[0]?.count || 0;
      const queryTime = Date.now() - queryStart;
      console.log(`✅ Jobs table accessible`);
      console.log(`   Total jobs: ${jobCount}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Jobs table query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Test 5: Payments table
    console.log('💰 Test 5: Payments Table');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const paymentCountResult = await db.select({ count: count() }).from(payments);
      const paymentCount = paymentCountResult[0]?.count || 0;
      const queryTime = Date.now() - queryStart;
      console.log(`✅ Payments table accessible`);
      console.log(`   Total payments: ${paymentCount}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Payments table query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Test 6: Order files table
    console.log('📁 Test 6: Order Files Table');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const filesCountResult = await db.select({ count: count() }).from(orderFiles);
      const filesCount = filesCountResult[0]?.count || 0;
      const queryTime = Date.now() - queryStart;
      console.log(`✅ Order files table accessible`);
      console.log(`   Total files: ${filesCount}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Order files table query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Test 7: Bids table
    console.log('🎯 Test 7: Bids Table');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const bidsCountResult = await db.select({ count: count() }).from(bids);
      const bidsCount = bidsCountResult[0]?.count || 0;
      const queryTime = Date.now() - queryStart;
      console.log(`✅ Bids table accessible`);
      console.log(`   Total bids: ${bidsCount}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ Bids table query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Test 8: Complex query (JOIN)
    console.log('🔗 Test 8: Complex Query (JOIN)');
    console.log('-'.repeat(60));
    try {
      const queryStart = Date.now();
      const result = await db
        .select({
          jobId: jobs.id,
          jobTitle: jobs.title,
          clientName: users.name,
        })
        .from(jobs)
        .leftJoin(users, sql`${jobs.clientId} = ${users.id}`)
        .limit(5);
      const queryTime = Date.now() - queryStart;
      console.log(`✅ JOIN query successful`);
      console.log(`   Rows returned: ${result.length}`);
      console.log(`   Query time: ${queryTime}ms`);
      console.log('');
    } catch (error) {
      console.error('❌ JOIN query failed:', error);
      allPassed = false;
      console.log('');
    }

    // Summary
    const totalTime = Date.now() - startTime;
    console.log('=' .repeat(60));
    console.log('📊 Test Summary');
    console.log('=' .repeat(60));
    console.log(`Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('');

    if (allPassed) {
      console.log('✅ Database connection is healthy and all tables are accessible');
      process.exit(0);
    } else {
      console.log('❌ Database connection has issues - review errors above');
      process.exit(1);
    }
  } catch (error) {
    console.error('');
    console.error('=' .repeat(60));
    console.error('💥 CRITICAL ERROR');
    console.error('=' .repeat(60));
    console.error(error);
    console.error('');
    console.error('⚠️  Database connection failed completely');
    console.error('⚠️  Check your environment variables and Turso configuration');
    process.exit(1);
  }
}

// Execute
testDatabaseConnection();
