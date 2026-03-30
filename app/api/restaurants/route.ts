// app/api/restaurants/route.ts
// List restaurants API endpoint (for dropdowns)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Build where clause based on user role
    const where: any = {
      isActive: true,
    };

    // For regular admins, only show their restaurants
    if (decoded.role !== "super_admin") {
      where.adminId = decoded.adminId;
    }

    // Fetch restaurants
    const restaurants = await prisma.restaurant.findMany({
      where,
      select: {
        restaurantId: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      restaurants,
    });
  } catch (error) {
    console.error("List restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 },
    );
  }
}
