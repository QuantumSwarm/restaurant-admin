// app/api/menus/[id]/route.ts
// UPDATED: Handles store assignment toggles (offered + in stock)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

// GET single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = parseInt(params.id);

    const menuItem = await prisma.menuTemplate.findUnique({
      where: { templateId },
      include: {
        restaurant: {
          select: {
            restaurantId: true,
            name: true,
            adminId: true,
          },
        },
        menuCategory: {
          select: {
            categoryId: true,
            name: true,
          },
        },
        subItems: true,
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && menuItem.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to view this menu item" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      menu: menuItem,
    });
  } catch (error) {
    console.error("Get menu item error:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// UPDATE menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = parseInt(params.id);
    const body = await request.json();

    // Check if menu item exists and get restaurant info
    const existingMenu = await prisma.menuTemplate.findUnique({
      where: { templateId },
      include: {
        restaurant: {
          select: { adminId: true },
        },
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && existingMenu.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to edit this menu item" },
        { status: 403 }
      );
    }

    const {
      name,
      description,
      categoryId,
      basePrice,
      imageUrl,
      calories,
      isActive,
      // Store-specific fields
      storeId,
      offeredAtStore,
      inStock,
    } = body;

    // Update menu template
    const updatedMenu = await prisma.menuTemplate.update({
      where: { templateId },
      data: {
        name: name || existingMenu.name,
        description: description !== undefined ? description : existingMenu.description,
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(categoryId) : null) : existingMenu.categoryId,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : existingMenu.basePrice,
        imageUrl: imageUrl !== undefined ? imageUrl : existingMenu.imageUrl,
        calories: calories !== undefined ? (calories ? parseInt(calories) : null) : existingMenu.calories,
        isActive: isActive !== undefined ? isActive : existingMenu.isActive,
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

    // Handle store assignment if storeId provided
    if (storeId) {
      const parsedStoreId = parseInt(storeId);
      
      // Check if assignment exists
      const existingAssignment = await prisma.menuItemAssignment.findUnique({
        where: {
          storeId_templateId: {
            storeId: parsedStoreId,
            templateId: templateId,
          },
        },
      });

      if (offeredAtStore) {
        // Create or update assignment
        if (existingAssignment) {
          // Update existing assignment
          await prisma.menuItemAssignment.update({
            where: {
              storeId_templateId: {
                storeId: parsedStoreId,
                templateId: templateId,
              },
            },
            data: {
              isAvailable: inStock !== undefined ? inStock : true,
            },
          });
        } else {
          // Create new assignment
          await prisma.menuItemAssignment.create({
            data: {
              storeId: parsedStoreId,
              templateId: templateId,
              isAvailable: inStock !== undefined ? inStock : true,
              display_order: 99,
            },
          });
        }
      } else {
        // Remove assignment if exists (not offered at this store)
        if (existingAssignment) {
          await prisma.menuItemAssignment.delete({
            where: {
              storeId_templateId: {
                storeId: parsedStoreId,
                templateId: templateId,
              },
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      menu: updatedMenu,
      message: "Menu item updated successfully",
    });
  } catch (error) {
    console.error("Update menu item error:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const templateId = parseInt(params.id);

    // Check if menu item exists and get restaurant info
    const existingMenu = await prisma.menuTemplate.findUnique({
      where: { templateId },
      include: {
        restaurant: {
          select: { adminId: true },
        },
      },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && existingMenu.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to delete this menu item" },
        { status: 403 }
      );
    }

    // Delete menu template (cascade will delete assignments and overrides)
    await prisma.menuTemplate.delete({
      where: { templateId },
    });

    return NextResponse.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    console.error("Delete menu item error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
