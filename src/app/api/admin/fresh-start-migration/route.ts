import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Disable foreign keys temporarily
    await db.execute(sql`SET CONSTRAINTS ALL DEFERRED`);

    // Drop all existing tables in reverse order of dependencies
    const dropTables = [
      'DROP TABLE IF EXISTS transactions_log',
      'DROP TABLE IF EXISTS ratings',
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS files',
      'DROP TABLE IF EXISTS messages',
      'DROP TABLE IF EXISTS order_history',
      'DROP TABLE IF EXISTS order_financials',
      'DROP TABLE IF EXISTS payments',
      'DROP TABLE IF EXISTS orders',
      'DROP TABLE IF EXISTS managers',
      'DROP TABLE IF EXISTS users',
      'DROP TABLE IF EXISTS roles',
    ];

    for (const dropQuery of dropTables) {
      await db.execute(sql.raw(dropQuery));
    }

    // Create roles table
    await db.execute(sql.raw(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      )
    `));

    // Insert roles
    await db.execute(sql.raw(`
      INSERT INTO roles (name, description) VALUES
      ('admin', 'System administrator with full access'),
      ('client', 'Client who posts orders'),
      ('manager', 'Manager who handles clients and assigns orders'),
      ('writer', 'Freelance writer who completes orders')
    `));

    // Create users table
    await db.execute(sql.raw(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        status TEXT DEFAULT 'pending',
        balance_available REAL DEFAULT 0,
        balance_pending REAL DEFAULT 0,
        total_earned REAL DEFAULT 0,
        rating REAL DEFAULT 0,
        completed_orders INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMPTZ,
        approved_by INTEGER REFERENCES users(id)
      )
    `));

    await db.execute(sql`CREATE INDEX idx_users_email ON users(email)`);
    await db.execute(sql`CREATE INDEX idx_users_role ON users(role_id)`);
    await db.execute(sql`CREATE INDEX idx_users_status ON users(status)`);

    // Create managers table
    await db.execute(sql.raw(`
      CREATE TABLE managers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_clients TEXT DEFAULT '[]',
        performance_rating REAL DEFAULT 0,
        total_orders_assigned INTEGER DEFAULT 0,
        total_orders_submitted INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    // Create orders table
    await db.execute(sql.raw(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        client_id INTEGER NOT NULL REFERENCES users(id),
        manager_id INTEGER REFERENCES users(id),
        writer_id INTEGER REFERENCES users(id),
        title TEXT NOT NULL,
        description TEXT,
        instructions TEXT,
        work_type TEXT DEFAULT 'writing',
        page_count INTEGER DEFAULT 0,
        slide_count INTEGER DEFAULT 0,
        client_cpp REAL DEFAULT 240,
        writer_cpp REAL DEFAULT 200,
        client_total REAL DEFAULT 0,
        writer_total REAL DEFAULT 0,
        manager_total REAL DEFAULT 0,
        deadline TIMESTAMPTZ,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        submitted INTEGER DEFAULT 0,
        paid INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        assigned_at TIMESTAMPTZ,
        submitted_at TIMESTAMPTZ,
        delivered_at TIMESTAMPTZ,
        approved_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ
      )
    `));

    await db.execute(sql`CREATE INDEX idx_orders_client ON orders(client_id)`);
    await db.execute(sql`CREATE INDEX idx_orders_manager ON orders(manager_id)`);
    await db.execute(sql`CREATE INDEX idx_orders_writer ON orders(writer_id)`);
    await db.execute(sql`CREATE INDEX idx_orders_status ON orders(status)`);
    await db.execute(sql`CREATE INDEX idx_orders_order_number ON orders(order_number)`);

    // Create order_financials table
    await db.execute(sql.raw(`
      CREATE TABLE order_financials (
        id SERIAL PRIMARY KEY,
        order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        client_amount REAL NOT NULL DEFAULT 0,
        writer_amount REAL NOT NULL DEFAULT 0,
        manager_assign_amount REAL DEFAULT 10,
        manager_submit_amount REAL DEFAULT 0,
        platform_fee REAL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_order_financials_order ON order_financials(order_id)`);

    // Create order_history table
    await db.execute(sql.raw(`
      CREATE TABLE order_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        actor_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_order_history_order ON order_history(order_id)`);
    await db.execute(sql`CREATE INDEX idx_order_history_actor ON order_history(actor_id)`);

    // Create messages table
    await db.execute(sql.raw(`
      CREATE TABLE messages (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        approved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMPTZ
      )
    `));

    await db.execute(sql`CREATE INDEX idx_messages_order ON messages(order_id)`);
    await db.execute(sql`CREATE INDEX idx_messages_sender ON messages(sender_id)`);
    await db.execute(sql`CREATE INDEX idx_messages_receiver ON messages(receiver_id)`);

    // Create files table
    await db.execute(sql.raw(`
      CREATE TABLE files (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        uploader_id INTEGER NOT NULL REFERENCES users(id),
        filename TEXT NOT NULL,
        file_url TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        category TEXT DEFAULT 'requirement',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_files_order ON files(order_id)`);
    await db.execute(sql`CREATE INDEX idx_files_uploader ON files(uploader_id)`);

    // Create notifications table
    await db.execute(sql.raw(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_notifications_user ON notifications(user_id)`);
    await db.execute(sql`CREATE INDEX idx_notifications_read ON notifications(is_read)`);

    // Create ratings table
    await db.execute(sql.raw(`
      CREATE TABLE ratings (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        rater_id INTEGER NOT NULL REFERENCES users(id),
        rated_user_id INTEGER NOT NULL REFERENCES users(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_ratings_order ON ratings(order_id)`);
    await db.execute(sql`CREATE INDEX idx_ratings_rated_user ON ratings(rated_user_id)`);

    // Create transactions_log table
    await db.execute(sql.raw(`
      CREATE TABLE transactions_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        order_id INTEGER REFERENCES orders(id),
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        balance_before REAL,
        balance_after REAL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `));

    await db.execute(sql`CREATE INDEX idx_transactions_user ON transactions_log(user_id)`);
    await db.execute(sql`CREATE INDEX idx_transactions_order ON transactions_log(order_id)`);

    // Create payments table
    await db.execute(sql.raw(`
      CREATE TABLE payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(id),
        amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'mpesa',
        transaction_id TEXT,
        phone_number TEXT,
        status TEXT DEFAULT 'pending',
        confirmed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        confirmed_at TIMESTAMPTZ
      )
    `));

    await db.execute(sql`CREATE INDEX idx_payments_order ON payments(order_id)`);
    await db.execute(sql`CREATE INDEX idx_payments_client ON payments(client_id)`);

    // Seed test user with password "test123"
    const hashedPassword = await bcrypt.hash('test123', 10);

    await db.execute(sql`INSERT INTO users (email, password, name, phone, role_id, status, approved_at) VALUES (${'test@tasklynk.com'}, ${hashedPassword}, ${'Test User'}, ${'+254701066845'}, ${1}, ${'approved'}, CURRENT_TIMESTAMP)`);

    // Add test user to managers table
    await db.execute(sql.raw(`INSERT INTO managers (user_id, assigned_clients) VALUES ((SELECT id FROM users WHERE email = 'test@tasklynk.com'), '[]')`));

    return NextResponse.json({
      success: true,
      message: 'Fresh database created successfully with test user (test@tasklynk.com / test123)'
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
