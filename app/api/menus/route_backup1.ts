// app/api/menus/route.ts
// MATCHES ACTUAL CURRENT SCHEMA (with snake_case fields)

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
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const storeId = searchParams.get("storeId");

    // Build where clause based on user role
    const where: any = {};

    // Role-based filtering
    if (user.role === "admin") {
      const adminRestaurants = await prisma.restaurant.findMany({
        where: { adminId: user.adminId },
        select: { restaurantId: true },
      });

      const restaurantIds = adminRestaurants.map((r) => r.restaurantId);
      where.restaurantId = { in: restaurantIds };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      where.categoryId = parseInt(category);
    }

    // Fetch menu templates
    const menuTemplates = await prisma.menuTemplate.findMany({
      where,
      include: {
        restaurant: {
          select: {
            restaurantId: true,
            name: true,
          },
        },
        menuCategory: {
          select: {
            categoryId: true,
            name: true,
          },
        },
        menuItemAssignments: storeId
          ? {
              where: { storeId: parseInt(storeId) },
              include: {
                menu_price_override: {
                  // FIXED: snake_case relation name
                  where: {
                    OR: [
                      { expires_at: null },
                      { expires_at: { gte: new Date() } },
                    ],
                  },
                  orderBy: { effective_from: "desc" },
                  take: 1,
                },
              },
            }
          : undefined,
        subItems: true,
      },
      orderBy: [{ name: "asc" }],
    });

    // Format data with store-specific info
    let formattedMenus;
    if (storeId) {
      formattedMenus = menuTemplates.map((template) => {
        const assignment = template.menuItemAssignments?.[0];
        const priceOverride = assignment?.menu_price_override?.[0];

        return {
          templateId: template.templateId,
          name: template.name,
          description: template.description,
          categoryId: template.categoryId,
          basePrice: template.basePrice,
          imageUrl: template.imageUrl,
          calories: template.calories,
          isActive: template.isActive,
          restaurant: template.restaurant,
          menuCategory: template.menuCategory,
          subItems: template.subItems,
          // Store-specific data
          isAssignedToStore: !!assignment,
          isAvailableAtStore: assignment?.isAvailable ?? false,
          displayOrder: assignment?.display_order ?? 99, // FIXED: snake_case field
          overriddenPrice: priceOverride?.overridden_price ?? null, // FIXED: snake_case field
          effectivePrice: priceOverride?.overridden_price ?? template.basePrice,
          assignmentId: assignment?.assignmentId ?? null,
        };
      });
    } else {
      formattedMenus = menuTemplates.map((template) => ({
        templateId: template.templateId,
        name: template.name,
        description: template.description,
        categoryId: template.categoryId,
        basePrice: template.basePrice,
        imageUrl: template.imageUrl,
        calories: template.calories,
        isActive: template.isActive,
        restaurant: template.restaurant,
        menuCategory: template.menuCategory,
        subItems: template.subItems,
        isAssignedToStore: false,
        isAvailableAtStore: false,
        displayOrder: 99,
        overriddenPrice: null,
        effectivePrice: template.basePrice,
        assignmentId: null,
      }));
    }

    // Get categories for filtering
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        categoryId: true,
        name: true,
      },
    });

    return NextResponse.json({
      success: true,
      menus: formattedMenus,
      total: formattedMenus.length,
      categories,
    });
  } catch (error) {
    console.error("List menus error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}

// CREATE new menu template
export async function POST(request: NextRequest) {
  try {
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
    const {
      restaurantId,
      name,
      description,
      categoryId,
      basePrice,
      imageUrl,
      calories,
      isActive,
      assignToStore,
      storeId,
    } = body;

    // Validation
    if (!restaurantId || !name || !basePrice) {
      return NextResponse.json(
        { error: "Restaurant, name, and base price are required" },
        { status: 400 },
      );
    }

    // Check authorization
    if (user.role === "admin") {
      const restaurant = await prisma.restaurant.findFirst({
        where: {
          restaurantId: parseInt(restaurantId),
          adminId: user.adminId,
        },
      });

      if (!restaurant) {
        return NextResponse.json(
          {
            error: "You do not have permission to add items to this restaurant",
          },
          { status: 403 },
        );
      }
    }

    // Create menu template
    const menuTemplate = await prisma.menuTemplate.create({
      data: {
        restaurantId: parseInt(restaurantId),
        name,
        description: description || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        basePrice: parseFloat(basePrice),
        imageUrl: imageUrl || null,
        calories: calories ? parseInt(calories) : null,
        isActive: isActive ?? true,
      },
      include: {
        restaurant: {
          select: {
            restaurantId: true,
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

    // Auto-assign to store if requested
    if (assignToStore && storeId) {
      await prisma.menuItemAssignment.create({
        data: {
          storeId: parseInt(storeId),
          templateId: menuTemplate.templateId,
          isAvailable: true,
          display_order: 99, // FIXED: snake_case field
        },
      });
    }

    return NextResponse.json({
      success: true,
      menu: menuTemplate,
      message: "Menu item created successfully",
    });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 },
    );
  }
}
