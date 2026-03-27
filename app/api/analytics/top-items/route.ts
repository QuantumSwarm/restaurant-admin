// app/api/analytics/top-items/route.ts
// Get top menu items by quantity sold and revenue

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
    const limit = searchParams.get('limit') || '10'; // Default top 10

    // Build date filter with EXPLICIT TYPE CASTING
    let dateFilter = '';
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = 'AND o.created_at BETWEEN $1::timestamp AND $2::timestamp';
      params.push(startDate, endDate);
    }

    // Build role-based filter
    let roleFilter = '';
    if (decoded.role !== 'super_admin') {
      // Admin sees only their stores' orders
      if (params.length > 0) {
        roleFilter = 'AND r.admin_id = $3';
        params.push(decoded.adminId);
      } else {
        roleFilter = 'AND r.admin_id = $1';
        params.push(decoded.adminId);
      }
    }

    // Add limit to params
    const limitParam = params.length > 0 ? `$${params.length + 1}` : '$1';
    params.push(parseInt(limit));

    // Query for top items
    const result = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        mt.template_id,
        mt.name,
        mc.name as category,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.quantity) as total_quantity,
        COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as total_revenue,
        COALESCE(AVG(oi.price_at_time), 0) as avg_price
      FROM order_item oi
      JOIN orders o ON oi.order_id = o.order_id
      JOIN menu_template mt ON oi.template_id = mt.template_id
      LEFT JOIN menu_category mc ON mt.category_id = mc.category_id
      JOIN store s ON o.store_id = s.store_id
      JOIN restaurant r ON s.restaurant_id = r.restaurant_id
      WHERE o.is_cancel = false
      ${dateFilter}
      ${roleFilter}
      GROUP BY mt.template_id, mt.name, mc.name
      ORDER BY total_revenue DESC
      LIMIT ${limitParam}
    `, ...params);

    // Format the data
    const topItems = result.map((row) => ({
      templateId: Number(row.template_id),
      name: row.name,
      category: row.category || 'Uncategorized',
      orderCount: Number(row.order_count),
      totalQuantity: Number(row.total_quantity),
      totalRevenue: Number(row.total_revenue),
      avgPrice: Number(row.avg_price),
    }));

    return NextResponse.json({
      success: true,
      topItems,
    });
  } catch (error) {
    console.error('Get top items error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top items' },
      { status: 500 }
    );
  }
}
