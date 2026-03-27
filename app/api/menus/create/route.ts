// app/api/menus/create/route.ts
// Create menu item API endpoint (POST) - FIXED for actual schema

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      restaurantId,
      name,
      description,
      categoryId, // Changed: using categoryId instead of category string
      basePrice,
      imageUrl,
      calories,
    } = body;

    // Validate required fields
    if (!restaurantId || !name || !basePrice) {
      return NextResponse.json(
        { error: "Restaurant, name, and price are required" },
        { status: 400 },
      );
    }

    // Validate price
    const price = parseFloat(basePrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { error: "Invalid price value" },
        { status: 400 },
      );
    }

    // For regular admins, verify they own the restaurant
    if (decoded.role !== "super_admin") {
      const restaurant = await prisma.restaurant.findUnique({
        where: { restaurantId: parseInt(restaurantId) },
      });

      if (!restaurant || restaurant.adminId !== decoded.adminId) {
        return NextResponse.json(
          {
            error: "You do not have permission to add items to this restaurant",
          },
          { status: 403 },
        );
      }
    }

    // Create menu item - using actual database column names
    const menuItem = await prisma.menuTemplate.create({
      data: {
        restaurantId: parseInt(restaurantId),
        name,
        description: description || null,
        categoryId: categoryId ? parseInt(categoryId) : null, // Using categoryId
        basePrice: price,
        imageUrl: imageUrl || null,
        calories: calories ? parseInt(calories) : null,
        isActive: true,
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
        menuCategory: {
          select: {
            categoryId: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item created successfully",
      menuItem,
    });
  } catch (error) {
    console.error("Create menu item error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 },
    );
  }
}
