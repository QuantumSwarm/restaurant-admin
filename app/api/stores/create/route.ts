// app/api/stores/create/route.ts
// Create store API endpoint (POST)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const {
      restaurantId,
      locationId,
      address,
      phonePrimary,
      phoneSecondary,
      isAiAgentEnabled,
      timeZone,
    } = body;

    // Validate required fields
    if (!restaurantId || !locationId || !address) {
      return NextResponse.json(
        { error: 'Restaurant, location, and address are required' },
        { status: 400 }
      );
    }

    // For regular admins, verify they own the restaurant
    if (decoded.role !== 'super_admin') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { restaurantId: parseInt(restaurantId) },
      });

      if (!restaurant || restaurant.adminId !== decoded.adminId) {
        return NextResponse.json(
          { error: 'You do not have permission to add stores to this restaurant' },
          { status: 403 }
        );
      }
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        restaurantId: parseInt(restaurantId),
        locationId: parseInt(locationId),
        address,
        phonePrimary: phonePrimary || null,
        phoneSecondary: phoneSecondary || null,
        isAiAgentEnabled: isAiAgentEnabled !== undefined ? isAiAgentEnabled : true,
        timeZone: timeZone || 'America/Toronto',
        isActive: true,
      },
      include: {
        restaurant: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Store created successfully',
      store,
    });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json(
      { error: 'Failed to create store' },
      { status: 500 }
    );
  }
}
