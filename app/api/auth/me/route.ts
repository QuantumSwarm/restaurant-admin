// app/api/auth/me/route.ts
// Get current authenticated user information

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get full user details from database
    const admin = await prisma.admin.findUnique({
      where: { adminId: user.adminId },
      select: {
        adminId: true,
        email: true,
        role: true,
        companyName: true,
        isActive: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: admin,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user information" },
      { status: 500 }
    );
  }
}
