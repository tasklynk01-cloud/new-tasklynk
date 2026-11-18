-- =====================================================
-- Order Chat Messages Table Creation Script
-- Run this entire script in Turso to create the table
-- =====================================================

-- Step 1: Create the order_chat_messages table
CREATE TABLE IF NOT EXISTS order_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
  order_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  display_sender_name TEXT,
  display_sender_role TEXT,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  read_at TEXT,
  chat_space TEXT,
  created_at TEXT NOT NULL
);

-- Step 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_order_id ON order_chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_sender_id ON order_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_created_at ON order_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_chat_space ON order_chat_messages(chat_space);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_order_sender ON order_chat_messages(order_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_order_chat_messages_is_read ON order_chat_messages(is_read);

-- =====================================================
-- Verification: Check if table was created successfully
-- =====================================================
-- You can run this query to verify:
-- SELECT name FROM sqlite_master WHERE type='table' AND name='order_chat_messages';
--
-- To see the table structure:
-- PRAGMA table_info(order_chat_messages);

