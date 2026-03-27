// app/api/stores/[id]/route.ts
// Individual store operations: GET, UPDATE, DELETE

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/auth/jwt";

// GET single store
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

    const storeId = parseInt(params.id);

    const store = await prisma.store.findUnique({
      where: { storeId },
      include: {
        restaurant: {
          select: {
            restaurantId: true,
            name: true,
            adminId: true,
          },
        },
        location: {
          select: {
            locationId: true,
            name: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && store.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to view this store" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      store: store,
    });
  } catch (error) {
    console.error("Get store error:", error);
    return NextResponse.json(
      { error: "Failed to fetch store" },
      { status: 500 }
    );
  }
}

// UPDATE store
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

    const storeId = parseInt(params.id);
    const body = await request.json();

    // Check if store exists and get restaurant info
    const existingStore = await prisma.store.findUnique({
      where: { storeId },
      include: {
        restaurant: {
          select: { adminId: true },
        },
      },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && existingStore.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to edit this store" },
        { status: 403 }
      );
    }

    const {
      locationId,
      address,
      phonePrimary,
      phoneSecondary,
      isAiAgentEnabled,
      timeZone,
    } = body;

    // Update store
    const updatedStore = await prisma.store.update({
      where: { storeId },
      data: {
        locationId: locationId ? parseInt(locationId) : existingStore.locationId,
        address: address || existingStore.address,
        phonePrimary: phonePrimary || existingStore.phonePrimary,
        phoneSecondary: phoneSecondary !== undefined ? phoneSecondary : existingStore.phoneSecondary,
        isAiAgentEnabled: isAiAgentEnabled !== undefined ? isAiAgentEnabled : existingStore.isAiAgentEnabled,
        timeZone: timeZone || existingStore.timeZone,
      },
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
    });

    return NextResponse.json({
      success: true,
      store: updatedStore,
      message: "Store updated successfully",
    });
  } catch (error) {
    console.error("Update store error:", error);
    return NextResponse.json(
      { error: "Failed to update store" },
      { status: 500 }
    );
  }
}

// DELETE store
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

    const storeId = parseInt(params.id);

    // Check if store exists and get restaurant info
    const existingStore = await prisma.store.findUnique({
      where: { storeId },
      include: {
        restaurant: {
          select: { adminId: true },
        },
      },
    });

    if (!existingStore) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check authorization
    if (user.role === "admin" && existingStore.restaurant.adminId !== user.adminId) {
      return NextResponse.json(
        { error: "You do not have permission to delete this store" },
        { status: 403 }
      );
    }

    // Soft delete (set isActive to false)
    await prisma.store.update({
      where: { storeId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("Delete store error:", error);
    return NextResponse.json(
      { error: "Failed to delete store" },
      { status: 500 }
    );
  }
}
