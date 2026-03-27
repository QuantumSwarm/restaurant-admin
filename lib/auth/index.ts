// lib/auth/index.ts
// Central auth module for easy imports

import { NextRequest } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";

/**
 * Verify authentication from request and extract user data
 * @param request - NextRequest object
 * @returns User payload or null if not authenticated
 */
export function verifyAuth(request: NextRequest): JWTPayload | null {
  try {
    // Get token from cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    // Verify and return token payload
    return verifyToken(token);
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

export { verifyToken } from "./jwt";
export type { JWTPayload } from "./jwt";
export { hasPermission } from "./permissions";
export { hashPassword, comparePassword } from "./password";
