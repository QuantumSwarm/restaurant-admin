// lib/auth/jwt.ts
// JWT token generation and verification utilities

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

export interface JWTPayload {
  adminId: number;
  email: string;
  role: 'admin' | 'super_admin';
}

/**
 * Generate a JWT token for authenticated user
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
