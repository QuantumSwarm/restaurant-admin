// app/api/analytics/peak-hours/route.ts
// Get peak hours analysis - orders grouped by hour of day
// FIXED: Uses only created_at (pickup_time is always NULL)

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter with EXPLICIT TYPE CASTING
    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = "AND o.created_at BETWEEN $1::timestamp AND $2::timestamp";
      params.push(startDate, endDate);
    }

    // Build role-based filter
    let roleFilter = "";
    if (decoded.role !== "super_admin") {
      // Admin sees only their stores' orders
      if (params.length > 0) {
        roleFilter = "AND r.admin_id = $3";
        params.push(decoded.adminId);
      } else {
        roleFilter = "AND r.admin_id = $1";
        params.push(decoded.adminId);
      }
    }

    // Query for peak hours - using created_at only
    const result = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        EXTRACT(HOUR FROM o.created_at) as hour,
        COUNT(o.order_id) as order_count,
        COALESCE(SUM(o.total_price), 0) as revenue
      FROM orders o
      JOIN store s ON o.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      WHERE o.is_cancel = false
      ${dateFilter}
      ${roleFilter}
      GROUP BY EXTRACT(HOUR FROM o.created_at)
      ORDER BY hour ASC
    `,
      ...params,
    );

    // Create a complete 24-hour array (fill missing hours with 0)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const found = result.find((row) => Number(row.hour) === hour);
      return {
        hour,
        orderCount: found ? Number(found.order_count) : 0,
        revenue: found ? Number(found.revenue) : 0,
      };
    });

    return NextResponse.json({
      success: true,
      peakHours: hourlyData,
    });
  } catch (error) {
    console.error("Get peak hours error:", error);
    return NextResponse.json(
      { error: "Failed to fetch peak hours data" },
      { status: 500 },
    );
  }
}
