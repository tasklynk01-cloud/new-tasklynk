import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { contactMessages, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { sendEmailToAdmins, getNewContactMessageAdminHTML } from '@/lib/email';

// GET: Fetch contact messages (for admin/manager only)
export async function GET(request: NextRequest) {
  try {
    // Authentication check using Bearer token OR session cookie
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId: number | null = null;
    
    // Try Bearer token first
    if (bearerToken) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
        
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(bearerToken, JWT_SECRET) as { userId: number };
        userId = decoded.userId;
      } catch (jwtError) {
        console.error('[Contact Messages] Bearer token validation failed:', jwtError);
      }
    }
    
    // Fallback to session cookie if Bearer token failed
    if (!userId) {
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('user_id');
      
      if (!userIdCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
      }
      
      userId = parseInt(userIdCookie.value);
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role (admin or manager)
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden - Admin or Manager access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limitParam = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offsetParam = parseInt(searchParams.get('offset') ?? '0');
    const status = searchParams.get('status'); // 'pending', 'read', 'resolved'

    // Build and execute query
    const results = status
      ? await db.select().from(contactMessages)
          .where(eq(contactMessages.status, status))
          .orderBy(desc(contactMessages.createdAt))
          .limit(limitParam)
          .offset(offsetParam)
      : await db.select().from(contactMessages)
          .orderBy(desc(contactMessages.createdAt))
          .limit(limitParam)
          .offset(offsetParam);

    return NextResponse.json({ messages: results, count: results.length }, { status: 200 });
  } catch (error) {
    console.error('GET contact messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Create a new contact message (from chat widget)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderName, senderEmail, senderPhone, content, isGuest } = body;

    if (!senderName || typeof senderName !== 'string' || senderName.trim() === '') {
      return NextResponse.json(
        { error: 'Sender name is required' },
        { status: 400 }
      );
    }

    if (!senderEmail || typeof senderEmail !== 'string' || senderEmail.trim() === '') {
      return NextResponse.json(
        { error: 'Sender email is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    const insertData = {
      senderName: senderName.trim(),
      senderEmail: senderEmail.trim(),
      senderPhone: senderPhone?.trim() || null,
      content: content.trim(),
      status: 'pending' as const,
      isGuest: isGuest ?? true,
      createdAt: new Date().toISOString(),
    };

    const [newMessage] = await db.insert(contactMessages).values(insertData).returning();

    // Send email notification to admins
    try {
      await sendEmailToAdmins({
        subject: `New Contact Message from ${insertData.senderName}`,
        html: getNewContactMessageAdminHTML(
          insertData.senderName,
          insertData.senderEmail,
          insertData.senderPhone,
          insertData.content,
          insertData.isGuest
        ),
      });
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError);
      // Continue execution - don't fail the request just because email failed
    }

    return NextResponse.json({ 
      message: newMessage,
      success: true 
    }, { status: 201 });
  } catch (error) {
    console.error('POST contact message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// PATCH: Update contact message status (admin/manager only)
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check using Bearer token OR session cookie
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    let userId: number | null = null;
    
    // Try Bearer token first
    if (bearerToken) {
      try {
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
        
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(bearerToken, JWT_SECRET) as { userId: number };
        userId = decoded.userId;
      } catch (jwtError) {
        console.error('[Contact Messages] Bearer token validation failed:', jwtError);
      }
    }
    
    // Fallback to session cookie if Bearer token failed
    if (!userId) {
      const cookieStore = await cookies();
      const userIdCookie = cookieStore.get('user_id');
      
      if (!userIdCookie?.value) {
        return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
      }
      
      userId = parseInt(userIdCookie.value);
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user role (admin or manager)
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
      return NextResponse.json({ error: 'Forbidden - Admin or Manager access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid message ID is required' },
        { status: 400 }
      );
    }

    if (!status || !['pending', 'read', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required (pending, read, resolved)' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
    };

    if (status === 'resolved') {
      updateData.resolvedBy = userId;
      updateData.resolvedAt = new Date().toISOString();
    }

    const [updated] = await db
      .update(contactMessages)
      .set(updateData)
      .where(eq(contactMessages.id, parseInt(id)))
      .returning();

    return NextResponse.json({ message: updated, success: true }, { status: 200 });
  } catch (error) {
    console.error('PATCH contact message error:', error);
    return NextResponse.json(
      { error: 'Failed to update message: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

