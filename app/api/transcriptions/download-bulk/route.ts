// app/api/transcriptions/download-bulk/route.ts
// Bulk download transcriptions as ZIP file
// Security: Validates ownership, rate limits, sanitizes input

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';
import JSZip from 'jszip';

const MAX_TRANSCRIPTIONS_PER_REQUEST = 100;

interface TranscriptionRecord {
  transcription_id: number;
  conversation_id: string;
  transcript_text: string;
  created_at: Date;
  store_id: number;
}

export async function POST(request: NextRequest) {
  try {
    // ──────────────────────────────────────────────────────────────────────
    // 1. Authentication & Authorization
    // ──────────────────────────────────────────────────────────────────────
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. Input Validation
    // ──────────────────────────────────────────────────────────────────────
    const body = await request.json();
    const { transcriptionIds } = body;

    // Validate transcriptionIds is an array
    if (!Array.isArray(transcriptionIds)) {
      return NextResponse.json(
        { error: 'transcriptionIds must be an array' },
        { status: 400 }
      );
    }

    // Check array is not empty
    if (transcriptionIds.length === 0) {
      return NextResponse.json(
        { error: 'No transcriptions selected' },
        { status: 400 }
      );
    }

    // Enforce rate limit
    if (transcriptionIds.length > MAX_TRANSCRIPTIONS_PER_REQUEST) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TRANSCRIPTIONS_PER_REQUEST} transcriptions per download` },
        { status: 400 }
      );
    }

    // Validate all IDs are positive integers
    const validIds = transcriptionIds.every(
      (id: any) => Number.isInteger(id) && id > 0
    );

    if (!validIds) {
      return NextResponse.json(
        { error: 'Invalid transcription IDs' },
        { status: 400 }
      );
    }

    console.log(`[Bulk Download] User ${decoded.adminId} requesting ${transcriptionIds.length} transcriptions`);

    // ──────────────────────────────────────────────────────────────────────
    // 3. Fetch Transcriptions with Permission Check
    // ──────────────────────────────────────────────────────────────────────
    
    // Build WHERE clause for permission check
    // Super admins can access all, regular admins only their stores
    const permissionClause = decoded.role === 'super_admin'
      ? ''
      : `AND r.admin_id = ${decoded.adminId}`;

    // Fetch transcriptions with ownership verification in a single query
    const transcriptions = await prisma.$queryRawUnsafe<TranscriptionRecord[]>(`
      SELECT 
        t.transcription_id,
        t.conversation_id,
        t.transcript_text,
        t.created_at,
        t.store_id
      FROM transcriptions t
      JOIN store s ON t.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      WHERE t.transcription_id = ANY($1::int[])
      ${permissionClause}
      ORDER BY t.created_at DESC
    `, transcriptionIds);

    // Check if any transcriptions were found
    if (transcriptions.length === 0) {
      return NextResponse.json(
        { error: 'No transcriptions found or access denied' },
        { status: 404 }
      );
    }

    // Log if some transcriptions were skipped (missing or no permission)
    const foundIds = transcriptions.map(t => t.transcription_id);
    const missingIds = transcriptionIds.filter((id: number) => !foundIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log(`[Bulk Download] Skipped ${missingIds.length} transcriptions (not found or no permission)`);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. Create ZIP File
    // ──────────────────────────────────────────────────────────────────────
    const zip = new JSZip();

    console.log(`[Bulk Download] Creating ZIP with ${transcriptions.length} files`);

    // Add each transcription as a text file
    for (const transcription of transcriptions) {
      // Create filename: transcript-{conversation_id}-{YYYY-MM-DD-HHmmss}.txt
      const dateStr = new Date(transcription.created_at)
        .toISOString()
        .replace(/T/, '-')
        .replace(/:/g, '')
        .slice(0, 17); // YYYY-MM-DD-HHmmss
      
      const filename = `transcript-${transcription.conversation_id}-${dateStr}.txt`;
      
      // Add file to ZIP
      zip.file(filename, transcription.transcript_text);
    }

    // Generate ZIP as buffer
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }, // Balance between size and speed
    });

    console.log(`[Bulk Download] ZIP created: ${zipBuffer.length} bytes`);

    // ──────────────────────────────────────────────────────────────────────
    // 5. Send ZIP File Response
    // ──────────────────────────────────────────────────────────────────────
    
    // Generate filename: transcriptions-YYYY-MM-DD.zip
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const zipFilename = `transcriptions-${today}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('[Bulk Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ZIP file' },
      { status: 500 }
    );
  }
}
