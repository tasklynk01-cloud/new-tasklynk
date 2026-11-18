import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {

    const migrations = [];

    // ============================================
    // JOB_MESSAGES TABLE - Add new columns
    // ============================================
    const checkJobMessages = await db.execute(sql`PRAGMA table_info(job_messages)`);
    const jobMessageColumns = checkJobMessages.rows as any[];
    
    if (!jobMessageColumns.some((col: any) => col.name === 'approved_by')) {
      await db.execute(sql`ALTER TABLE job_messages ADD COLUMN approved_by INTEGER`);
      migrations.push('job_messages.approved_by added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'approved_at')) {
      await db.execute(sql`ALTER TABLE job_messages ADD COLUMN approved_at TEXT`);
      migrations.push('job_messages.approved_at added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'visible_to_client')) {
      await db.execute(sql`ALTER TABLE job_messages ADD COLUMN visible_to_client INTEGER DEFAULT 0`);
      migrations.push('job_messages.visible_to_client added');
    }
    
    if (!jobMessageColumns.some((col: any) => col.name === 'visible_to_freelancer')) {
      await db.execute(sql`ALTER TABLE job_messages ADD COLUMN visible_to_freelancer INTEGER DEFAULT 0`);
      migrations.push('job_messages.visible_to_freelancer added');
    }

    if (!jobMessageColumns.some((col: any) => col.name === 'attachment_count')) {
      await db.execute(sql`ALTER TABLE job_messages ADD COLUMN attachment_count INTEGER DEFAULT 0`);
      migrations.push('job_messages.attachment_count added');
    }

    // ============================================
    // JOB_ATTACHMENTS TABLE - Add new columns
    // ============================================
    const checkAttachments = await db.execute(sql`PRAGMA table_info(job_attachments)`);
    const attachmentColumns = checkAttachments.rows as any[];
    
    if (!attachmentColumns.some((col: any) => col.name === 'upload_category')) {
      await db.execute(sql`ALTER TABLE job_attachments ADD COLUMN upload_category TEXT DEFAULT 'general'`);
      migrations.push('job_attachments.upload_category added');
    }
    
    if (!attachmentColumns.some((col: any) => col.name === 'message_id')) {
      await db.execute(sql`ALTER TABLE job_attachments ADD COLUMN message_id INTEGER`);
      migrations.push('job_attachments.message_id added');
    }
    
    if (!attachmentColumns.some((col: any) => col.name === 'is_visible')) {
      await db.execute(sql`ALTER TABLE job_attachments ADD COLUMN is_visible INTEGER DEFAULT 1`);
      migrations.push('job_attachments.is_visible added');
    }

    if (!attachmentColumns.some((col: any) => col.name === 'shortened_name')) {
      await db.execute(sql`ALTER TABLE job_attachments ADD COLUMN shortened_name TEXT`);
      migrations.push('job_attachments.shortened_name added');
    }

    // ============================================
    // MESSAGES TABLE - Add new columns (for global messages dashboard)
    // ============================================
    const checkMessages = await db.execute(sql`PRAGMA table_info(messages)`);
    const messageColumns = checkMessages.rows as any[];
    
    if (!messageColumns.some((col: any) => col.name === 'approved_by')) {
      await db.execute(sql`ALTER TABLE messages ADD COLUMN approved_by INTEGER`);
      migrations.push('messages.approved_by added');
    }
    
    if (!messageColumns.some((col: any) => col.name === 'approved_at')) {
      await db.execute(sql`ALTER TABLE messages ADD COLUMN approved_at TEXT`);
      migrations.push('messages.approved_at added');
    }
    
    if (!messageColumns.some((col: any) => col.name === 'is_read')) {
      await db.execute(sql`ALTER TABLE messages ADD COLUMN is_read INTEGER DEFAULT 0`);
      migrations.push('messages.is_read added');
    }

    if (!messageColumns.some((col: any) => col.name === 'attachment_count')) {
      await db.execute(sql`ALTER TABLE messages ADD COLUMN attachment_count INTEGER DEFAULT 0`);
      migrations.push('messages.attachment_count added');
    }

    // ============================================
    // Update existing visibility logic
    // ============================================
    
    // For job_messages: Approved messages should be visible to both parties
    await db.execute(sql`
      UPDATE job_messages 
      SET visible_to_client = 1, visible_to_freelancer = 1 
      WHERE admin_approved = 1
    `);
    
    // For job_messages: Unapproved messages are only visible to sender and admin
    await db.execute(sql`
      UPDATE job_messages 
      SET visible_to_client = 0, visible_to_freelancer = 0 
      WHERE admin_approved = 0 OR admin_approved IS NULL
    `);

    // ============================================
    // Generate shortened names for existing files
    // ============================================
    const existingFiles = await db.execute(sql`SELECT id, file_name FROM job_attachments WHERE shortened_name IS NULL`);
    
    for (const file of existingFiles.rows as any[]) {
      const fileName = file.file_name || '';
      const maxLength = 30;
      let shortened = fileName;
      
      if (fileName.length > maxLength) {
        const ext = fileName.substring(fileName.lastIndexOf('.'));
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        shortened = nameWithoutExt.substring(0, maxLength - ext.length - 3) + '...' + ext;
      }
      
      await db.execute(sql`UPDATE job_attachments SET shortened_name = ${shortened} WHERE id = ${file.id}`);
    }
    migrations.push('Generated shortened names for existing files');

    // ============================================
    // Final verification
    // ============================================
    const jobMessagesCount = await db.execute(sql`SELECT COUNT(*) as count FROM job_messages`);
    const attachmentsCount = await db.execute(sql`SELECT COUNT(*) as count FROM job_attachments`);
    const messagesCount = await db.execute(sql`SELECT COUNT(*) as count FROM messages`);

    const stats = {
      job_messages: (jobMessagesCount.rows[0] as any).count,
      job_attachments: (attachmentsCount.rows[0] as any).count,
      messages: (messagesCount.rows[0] as any).count,
      migrations_applied: migrations.length
    };


    return NextResponse.json({
      success: true,
      message: 'Comprehensive migration completed successfully',
      migrations,
      stats
    });

  } catch (error) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

