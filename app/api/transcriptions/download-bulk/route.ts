// app/api/transcriptions/download-bulk/route.ts
// FIXED: Correct Buffer type for NextResponse

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import archiver from "archiver";
//import { Readable } from "stream";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { transcriptionIds } = body;

    if (!transcriptionIds || !Array.isArray(transcriptionIds)) {
      return NextResponse.json(
        { error: "Invalid transcription IDs" },
        { status: 400 },
      );
    }

    // Create a zip archive
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    const chunks: Buffer[] = [];

    // Collect all chunks
    archive.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Wait for archive to finish
    await new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", (err: Error) => reject(err));

      // Add files to archive
      transcriptionIds.forEach((id: string, index: number) => {
        const content = `Transcription ${id}\n\nSample transcription content...`;
        archive.append(content, { name: `transcription_${index + 1}.txt` });
      });

      archive.finalize();
    });

    // FIXED: Combine chunks into a single Buffer and convert to Uint8Array
    const zipBuffer = Buffer.concat(chunks);
    const uint8Array = new Uint8Array(zipBuffer);

    // Return the zip file
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="transcriptions_${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error("Bulk download error:", error);
    return NextResponse.json(
      { error: "Failed to create download" },
      { status: 500 },
    );
  }
}
