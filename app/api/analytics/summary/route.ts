// app/api/analytics/summary/route.ts
// Get analytics summary metrics (orders, revenue, AOV)

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

    console.log("[Analytics] Decoded token:", {
      role: decoded.role,
      adminId: decoded.adminId,
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      // Cast incoming date strings to timestamp to avoid Postgres type errors
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

    console.log("[Analytics] Filters:", {
      dateFilter,
      roleFilter,
      params,
    });

    // Query for summary metrics
    const result = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT 
        COUNT(o.order_id) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_revenue,
        COALESCE(AVG(o.total_price), 0) as avg_order_value,
        COUNT(DISTINCT o.customer_id) as unique_customers
      FROM orders o
      JOIN store s ON o.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      WHERE o.is_cancel = false
      ${dateFilter}
      ${roleFilter}
    `,
      ...params,
    );

    console.log("[Analytics] Query result:", result);

    const metrics = result[0] || {
      total_orders: 0,
      total_revenue: 0,
      avg_order_value: 0,
      unique_customers: 0,
    };

    console.log("[Analytics] Metrics:", metrics);

    // Convert to numbers and format
    const summary = {
      totalOrders: Number(metrics.total_orders),
      totalRevenue: Number(metrics.total_revenue),
      avgOrderValue: Number(metrics.avg_order_value),
      uniqueCustomers: Number(metrics.unique_customers),
    };

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Get analytics summary error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics summary" },
      { status: 500 },
    );
  }
}
