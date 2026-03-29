// app/api/stores/route.ts
// FIXED: Returns full store data for list view + supports search

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
        { status: 401 }
      );
    }

    // Verify token
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const format = searchParams.get("format"); // 'dropdown' or default (list)

    // Build where clause based on user role
    const where: any = {
      isActive: true,
    };

    // Role-based filtering
    if (user.role === "admin") {
      // Admins can only see stores from their restaurants
      const adminRestaurants = await prisma.restaurant.findMany({
        where: { 
          adminId: user.adminId,
          isActive: true 
        },
        select: { restaurantId: true },
      });

      const restaurantIds = adminRestaurants.map((r) => r.restaurantId);
      where.restaurantId = { in: restaurantIds };
    }
    // Super Admin can see all stores (no additional filtering)

    // FIXED: Add search functionality
    if (search) {
      where.OR = [
        { address: { contains: search, mode: "insensitive" } },
        { phonePrimary: { contains: search, mode: "insensitive" } },
        { location: { name: { contains: search, mode: "insensitive" } } },
        { restaurant: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Fetch stores with restaurant and location info
    const stores = await prisma.store.findMany({
      where,
      include: {
        restaurant: {
          select: {
            restaurantId: true,
            name: true,
          },
        },
        location: {
          select: {
            locationId: true,
            name: true,
          },
        },
      },
      orderBy: [
        { restaurant: { name: "asc" } },
        { location: { name: "asc" } },
      ],
    });

    // Return dropdown format if requested
    if (format === "dropdown") {
      const formattedStores = stores.map((store) => ({
        storeId: store.storeId,
        restaurantId: store.restaurant.restaurantId,
        restaurantName: store.restaurant.name,
        locationName: store.location.name,
        displayName: `${store.restaurant.name} - ${store.location.name}`,
        address: store.address,
        isActive: store.isActive,
      }));

      return NextResponse.json({
        success: true,
        stores: formattedStores,
        total: formattedStores.length,
      });
    }

    // Return full store data for list view (default)
    return NextResponse.json({
      success: true,
      stores: stores,
      total: stores.length,
    });
  } catch (error) {
    console.error("Fetch stores error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
