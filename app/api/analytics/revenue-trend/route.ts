// app/api/analytics/revenue-trend/route.ts
// Get revenue trend data grouped by date - FIXED with type casting

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

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

    // Query for daily revenue trend
    const result = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        DATE(o.created_at) as date,
        COUNT(o.order_id) as order_count,
        COALESCE(SUM(o.total_price), 0) as revenue
      FROM orders o
      JOIN store s ON o.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      WHERE o.is_cancel = false
      ${dateFilter}
      ${roleFilter}
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `,
      ...params,
    );

    // Format the data for charts
    const trendData = result.map((row) => ({
      date: row.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
      revenue: Number(row.revenue),
      orderCount: Number(row.order_count),
    }));

    return NextResponse.json({
      success: true,
      trend: trendData,
    });
  } catch (error) {
    console.error("Get revenue trend error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue trend" },
      { status: 500 },
    );
  }
}
