// app/api/transcriptions/route.ts
// List transcriptions with filtering, search, and date range

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: startDate, endDate' },
        { status: 400 }
      );
    }

    // Build permission clause
    const permissionClause = decoded.role === 'super_admin'
      ? ''
      : `AND r.admin_id = ${decoded.adminId}`;

    // Build search clause
    const searchClause = search && search.trim()
      ? `AND t.transcript_text ILIKE '%${search.trim().replace(/'/g, "''")}%'`
      : '';

    // Query transcriptions with customer information
    const transcriptions = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        t.transcription_id,
        t.store_id,
        t.conversation_id,
        t.session_id,
        t.transcript_text,
        t.duration_seconds,
        t.word_count,
        t.customer_name,
        t.phone_number_id,
        t.phone_number,
        t.created_at,
        t.fetched_at,
        r.name as store_name,
        loc.name as location_name
      FROM transcriptions t
      JOIN store s ON t.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      LEFT JOIN location loc ON s.location_id = loc.location_id
      WHERE 1=1
      AND t.created_at BETWEEN $1::timestamp AND $2::timestamp
      ${permissionClause}
      ${searchClause}
      ORDER BY t.created_at DESC
      LIMIT 100
    `, startDate, endDate);

    // Format response with preview
    const formattedTranscriptions = transcriptions.map((t: any) => ({
      transcriptionId: t.transcription_id,
      storeId: t.store_id,
      storeName: t.store_name,
      locationName: t.location_name,
      conversationId: t.conversation_id,
      transcriptText: t.transcript_text,
      preview: t.transcript_text.substring(0, 200), // First 200 chars for preview
      durationSeconds: t.duration_seconds,
      wordCount: t.word_count,
      customerName: t.customer_name,
      phoneNumberId: t.phone_number_id,
      phoneNumber: t.phone_number,
      createdAt: t.created_at,
    }));

    return NextResponse.json({
      success: true,
      transcriptions: formattedTranscriptions,
      count: formattedTranscriptions.length,
    });

  } catch (error) {
    console.error('[List Transcriptions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcriptions' },
      { status: 500 }
    );
  }
}
