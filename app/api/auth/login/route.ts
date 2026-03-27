// app/api/auth/login/route.ts
// Login API endpoint - handles email/password authentication

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { comparePassword } from '@/lib/auth/password';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
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
    
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Check if admin exists
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if admin is active
    if (!admin.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, admin.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role as 'admin' | 'super_admin',
    });

    // Create response with token and user data
    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          adminId: admin.adminId,
          email: admin.email,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    // Set token in HTTP-only cookie for middleware
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
