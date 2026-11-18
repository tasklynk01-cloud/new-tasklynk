/**
 * Comprehensive Database Validation and Table Creation Script
 * This script verifies all tables exist and creates missing ones
 */

const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Define all table creation statements based on schema.ts
const tableCreationStatements = {
  accounts: `
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_name TEXT NOT NULL UNIQUE,
      contact_person TEXT NOT NULL,
      contact_email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  domains: `
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      max_users INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  system_settings: `
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT NOT NULL UNIQUE PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT NOT NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  invitations: `
    CREATE TABLE IF NOT EXISTS invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending',
      used INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      role_id INTEGER NOT NULL DEFAULT 2,
      approved INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      balance REAL NOT NULL DEFAULT 0,
      earned REAL NOT NULL DEFAULT 0,
      total_earnings REAL NOT NULL DEFAULT 0,
      rating REAL,
      rating_average REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      badge_list TEXT NOT NULL DEFAULT '[]',
      presence_status TEXT NOT NULL DEFAULT 'offline',
      phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      suspended_until TEXT,
      suspension_reason TEXT,
      blacklist_reason TEXT,
      rejected_at TEXT,
      rejection_reason TEXT,
      total_earned REAL NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0,
      completed_jobs INTEGER NOT NULL DEFAULT 0,
      completion_rate REAL,
      profile_picture_url TEXT,
      last_login_at TEXT,
      last_login_ip TEXT,
      last_login_device TEXT,
      login_count INTEGER NOT NULL DEFAULT 0,
      domain_id INTEGER REFERENCES domains(id) ON DELETE SET NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      account_name TEXT,
      assigned_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      freelancer_badge TEXT,
      client_tier TEXT DEFAULT 'basic',
      client_priority TEXT NOT NULL DEFAULT 'regular',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  users_phone_unique: `
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users(phone)
  `,
  
  user_stats: `
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      total_jobs_posted INTEGER NOT NULL DEFAULT 0,
      total_jobs_completed INTEGER NOT NULL DEFAULT 0,
      total_jobs_cancelled INTEGER NOT NULL DEFAULT 0,
      total_amount_earned REAL NOT NULL DEFAULT 0,
      total_amount_spent REAL NOT NULL DEFAULT 0,
      average_rating REAL,
      total_ratings INTEGER NOT NULL DEFAULT 0,
      on_time_delivery INTEGER NOT NULL DEFAULT 0,
      late_delivery INTEGER NOT NULL DEFAULT 0,
      revisions_requested INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  jobs: `
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_id TEXT NOT NULL UNIQUE,
      order_number TEXT NOT NULL UNIQUE,
      order_id TEXT NOT NULL UNIQUE,
      account_order_number TEXT,
      account_linked INTEGER NOT NULL DEFAULT 0,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      instructions TEXT NOT NULL,
      work_type TEXT NOT NULL,
      pages INTEGER,
      slides INTEGER,
      problems INTEGER,
      amount REAL NOT NULL,
      manager_earnings REAL NOT NULL DEFAULT 0,
      freelancer_earnings REAL NOT NULL DEFAULT 0,
      admin_profit REAL NOT NULL DEFAULT 0,
      deadline TEXT NOT NULL,
      actual_deadline TEXT NOT NULL,
      freelancer_deadline TEXT NOT NULL,
      request_draft INTEGER NOT NULL DEFAULT 0,
      draft_delivered INTEGER NOT NULL DEFAULT 0,
      request_printable_sources INTEGER NOT NULL DEFAULT 0,
      single_spaced INTEGER NOT NULL DEFAULT 0,
      base_cpp REAL,
      effective_cpp REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      manager_approved INTEGER NOT NULL DEFAULT 0,
      manager_approved_at TEXT,
      manager_approval_notes TEXT,
      assigned_editor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      editor_approved INTEGER NOT NULL DEFAULT 0,
      editor_approved_at TEXT,
      editor_approval_notes TEXT,
      admin_approved INTEGER NOT NULL DEFAULT 0,
      client_approved INTEGER NOT NULL DEFAULT 0,
      approved_by_client_at TEXT,
      revision_requested INTEGER NOT NULL DEFAULT 0,
      revision_notes TEXT,
      payment_confirmed INTEGER NOT NULL DEFAULT 0,
      paid_order_confirmed_at TEXT,
      invoice_generated INTEGER NOT NULL DEFAULT 0,
      client_rating INTEGER,
      writer_rating INTEGER,
      review_comment TEXT,
      placement_priority INTEGER NOT NULL DEFAULT 0,
      urgency_multiplier REAL NOT NULL DEFAULT 1.0,
      calculated_price REAL,
      is_real_order INTEGER NOT NULL DEFAULT 1,
      requires_reports INTEGER NOT NULL DEFAULT 1,
      final_submission_complete INTEGER NOT NULL DEFAULT 0,
      revision_submission_complete INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  bids: `
    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      bid_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
  `,
  
  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'mpesa',
      status TEXT NOT NULL DEFAULT 'pending',
      mpesa_code TEXT,
      phone_number TEXT,
      mpesa_checkout_request_id TEXT,
      mpesa_merchant_request_id TEXT,
      mpesa_receipt_number TEXT,
      mpesa_transaction_date TEXT,
      mpesa_result_desc TEXT,
      paystack_reference TEXT,
      confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
      confirmed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  notifications: `
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,
  
  job_messages: `
    CREATE TABLE IF NOT EXISTS job_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      admin_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,
  
  ratings: `
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rated_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      comment TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  job_attachments: `
    CREATE TABLE IF NOT EXISTS job_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      upload_type TEXT NOT NULL,
      attachment_category TEXT,
      scheduled_deletion_at TEXT,
      deleted_at TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  invoices: `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      freelancer_amount REAL NOT NULL,
      admin_commission REAL NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      is_paid INTEGER NOT NULL DEFAULT 0,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  messages: `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      file_url TEXT,
      admin_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,
  
  revisions: `
    CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      submitted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      revision_notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review',
      sent_to_freelancer INTEGER NOT NULL DEFAULT 0,
      approved_by_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  email_logs: `
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sent_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sent_to TEXT NOT NULL,
      recipient_type TEXT NOT NULL,
      recipient_count INTEGER NOT NULL,
      from_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      failed_recipients TEXT,
      job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    )
  `,
  
  job_files: `
    CREATE TABLE IF NOT EXISTS job_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      upload_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  order_files: `
    CREATE TABLE IF NOT EXISTS order_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_type TEXT NOT NULL,
      notes TEXT,
      version_number INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    )
  `,
  
  email_verification_codes: `
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,
  
  pending_registrations: `
    CREATE TABLE IF NOT EXISTS pending_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      account_name TEXT,
      verification_code TEXT NOT NULL,
      code_expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  password_reset_tokens: `
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `,
  
  payment_requests: `
    CREATE TABLE IF NOT EXISTS payment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      phone_number TEXT,
      transaction_reference TEXT,
      created_at TEXT NOT NULL,
      confirmed_at TEXT,
      confirmed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      rejection_reason TEXT
    )
  `,
  
  email_notifications: `
    CREATE TABLE IF NOT EXISTS email_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      notification_type TEXT NOT NULL,
      sent_to TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent',
      created_at TEXT NOT NULL
    )
  `,
  
  manager_invitations: `
    CREATE TABLE IF NOT EXISTS manager_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      token TEXT NOT NULL UNIQUE,
      role TEXT DEFAULT 'manager',
      status TEXT DEFAULT 'pending',
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      used_at TEXT,
      expires_at TEXT
    )
  `,
  
  job_status_logs: `
    CREATE TABLE IF NOT EXISTS job_status_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      note TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  order_history: `
    CREATE TABLE IF NOT EXISTS order_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  writer_balances: `
    CREATE TABLE IF NOT EXISTS writer_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      writer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      available_balance REAL NOT NULL DEFAULT 0,
      pending_balance REAL NOT NULL DEFAULT 0,
      total_earned REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )
  `,
  
  managers: `
    CREATE TABLE IF NOT EXISTS managers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      phone TEXT,
      balance REAL NOT NULL DEFAULT 0,
      total_earnings REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  client_manager: `
    CREATE TABLE IF NOT EXISTS client_manager (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  client_manager_unique: `
    CREATE UNIQUE INDEX IF NOT EXISTS client_manager_client_manager_unique ON client_manager(client_id, manager_id)
  `,
  
  manager_earnings: `
    CREATE TABLE IF NOT EXISTS manager_earnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      earning_type TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  user_categories: `
    CREATE TABLE IF NOT EXISTS user_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  system_logs: `
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT,
      context TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  badges: `
    CREATE TABLE IF NOT EXISTS badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      criteria TEXT NOT NULL,
      category TEXT NOT NULL,
      color TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  user_badges: `
    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
      badge_name TEXT,
      badge_icon TEXT,
      awarded_at TEXT NOT NULL,
      awarded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT,
      description TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  payout_requests: `
    CREATE TABLE IF NOT EXISTS payout_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      writer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      account_details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TEXT NOT NULL,
      processed_at TEXT,
      processed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      rejection_reason TEXT,
      transaction_reference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  admin_audit_logs: `
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      target_id INTEGER,
      target_type TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  writer_tiers: `
    CREATE TABLE IF NOT EXISTS writer_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      min_rating REAL NOT NULL,
      min_jobs INTEGER NOT NULL,
      min_success_rate REAL NOT NULL,
      benefits TEXT,
      color TEXT,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  conversations: `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
      participant1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      participant2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      last_message_at TEXT,
      last_message_sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      last_message_preview TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  freelancer_profiles: `
    CREATE TABLE IF NOT EXISTS freelancer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      skills TEXT,
      certifications TEXT,
      portfolio TEXT,
      hourly_rate REAL,
      languages TEXT,
      timezone TEXT,
      availability TEXT DEFAULT 'part-time',
      response_time INTEGER,
      total_clients INTEGER DEFAULT 0,
      repeat_client_rate REAL DEFAULT 0,
      jobs_completed INTEGER DEFAULT 0,
      is_profile_complete INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  editor_profiles: `
    CREATE TABLE IF NOT EXISTS editor_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      specialization TEXT,
      years_experience INTEGER,
      languages TEXT,
      qualifications TEXT,
      areas_of_expertise TEXT,
      average_edits_per_order INTEGER DEFAULT 0,
      orders_touched INTEGER DEFAULT 0,
      client_satisfaction_rate REAL DEFAULT 0,
      is_profile_complete INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  editor_assignments: `
    CREATE TABLE IF NOT EXISTS editor_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      editor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      assigned_at TEXT NOT NULL,
      review_started_at TEXT,
      approval_status TEXT NOT NULL DEFAULT 'pending',
      approval_reason TEXT,
      revisions_requested INTEGER NOT NULL DEFAULT 0,
      revision_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  payment_transactions: `
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      reason TEXT,
      created_at TEXT NOT NULL
    )
  `,
  
  client_profiles: `
    CREATE TABLE IF NOT EXISTS client_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT,
      industry TEXT,
      website TEXT,
      tax_id TEXT,
      business_registration TEXT,
      billing_address TEXT,
      shipping_address TEXT,
      preferred_payment_method TEXT,
      automate_payments INTEGER DEFAULT 0,
      total_jobs_posted INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      recurring_client_discount REAL DEFAULT 0,
      is_profile_complete INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  client_freelancer_history: `
    CREATE TABLE IF NOT EXISTS client_freelancer_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      freelancer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      completed_jobs_count INTEGER NOT NULL DEFAULT 1,
      last_worked_at TEXT NOT NULL,
      avg_rating REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
  
  client_freelancer_unique: `
    CREATE UNIQUE INDEX IF NOT EXISTS client_freelancer_unique ON client_freelancer_history(client_id, freelancer_id)
  `,
  
  freelancer_online_status: `
    CREATE TABLE IF NOT EXISTS freelancer_online_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      is_online INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT NOT NULL,
      current_jobs_count INTEGER NOT NULL DEFAULT 0,
      online_status_updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  manager_online_status: `
    CREATE TABLE IF NOT EXISTS manager_online_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      is_online INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT NOT NULL,
      online_status_updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  client_online_status: `
    CREATE TABLE IF NOT EXISTS client_online_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      is_online INTEGER NOT NULL DEFAULT 0,
      last_seen_at TEXT NOT NULL,
      online_status_updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  freelancer_cpp_levels: `
    CREATE TABLE IF NOT EXISTS freelancer_cpp_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level INTEGER NOT NULL UNIQUE,
      level_name TEXT NOT NULL,
      description TEXT NOT NULL,
      completed_orders_required INTEGER NOT NULL,
      cpp_non_technical REAL NOT NULL,
      cpp_technical REAL NOT NULL,
      order_count_in_level INTEGER NOT NULL,
      progress_bar_color TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `,
  
  freelancer_cpp_progress: `
    CREATE TABLE IF NOT EXISTS freelancer_cpp_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      freelancer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      current_level INTEGER NOT NULL DEFAULT 1,
      total_completed_orders INTEGER NOT NULL DEFAULT 0,
      orders_in_current_level INTEGER NOT NULL DEFAULT 0,
      progress_percentage REAL NOT NULL DEFAULT 0,
      next_level_orders_required INTEGER NOT NULL DEFAULT 3,
      is_work_type_specialized INTEGER NOT NULL DEFAULT 0,
      last_progress_update TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `,
};

async function checkTableExists(tableName) {
  try {
    const result = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      args: [tableName],
    });
    return result.rows.length > 0;
  } catch (error) {
    console.error(`❌ Error checking table ${tableName}:`, error.message);
    return false;
  }
}

async function createTable(tableName, sql) {
  try {
    await client.execute(sql);
    console.log(`✅ Created/verified table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error.message);
    return false;
  }
}

async function validateAndCreateTables() {
  console.log('🔍 Starting database validation and table creation...\n');
  
  // Test connection first
  console.log('📡 Testing database connection...');
  try {
    await client.execute('SELECT 1');
    console.log('✅ Database connection successful!\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in .env file');
    process.exit(1);
  }
  
  const results = {
    total: 0,
    existing: 0,
    created: 0,
    failed: 0,
  };
  
  // Process each table
  for (const [tableName, sql] of Object.entries(tableCreationStatements)) {
    // Skip index entries
    if (tableName.includes('_unique') || tableName.includes('_index')) {
      await createTable(tableName, sql);
      continue;
    }
    
    results.total++;
    
    const exists = await checkTableExists(tableName);
    
    if (exists) {
      console.log(`✓ Table exists: ${tableName}`);
      results.existing++;
    } else {
      console.log(`⚠ Table missing: ${tableName}, creating...`);
      const created = await createTable(tableName, sql);
      if (created) {
        results.created++;
      } else {
        results.failed++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total tables checked: ${results.total}`);
  console.log(`✅ Existing tables: ${results.existing}`);
  console.log(`✨ Created tables: ${results.created}`);
  console.log(`❌ Failed tables: ${results.failed}`);
  console.log('='.repeat(60) + '\n');
  
  if (results.failed > 0) {
    console.log('⚠️  Some tables failed to create. Please check the errors above.');
    process.exit(1);
  } else {
    console.log('✅ All tables are ready! Database is fully synchronized with schema.');
  }
}

// Run the validation
validateAndCreateTables()
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
