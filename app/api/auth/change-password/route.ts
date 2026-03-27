// app/api/auth/change-password/route.ts
// Change password API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { comparePassword, hashPassword } from '@/lib/auth/password';
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

    // Verify token and get user info
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get admin from database
    const admin = await prisma.admin.findUnique({
      where: { adminId: decoded.adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
      currentPassword,
      admin.passwordHash
    );

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Check if new password is same as current
    const isSamePassword = await comparePassword(newPassword, admin.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await prisma.admin.update({
      where: { adminId: decoded.adminId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Clear the token cookie to force re-login
    const response = NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully. Please login again.',
      },
      { status: 200 }
    );

    response.cookies.delete('token');

    return response;
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'An error occurred while changing password' },
      { status: 500 }
    );
  }
}
