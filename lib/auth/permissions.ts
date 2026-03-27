// lib/auth/permissions.ts
// Permission checking utilities

export type UserRole = 'admin' | 'super_admin';

export interface User {
  adminId: number;
  email: string;
  role: UserRole;
}

/**
 * Check if user is Super Admin
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'super_admin';
}

/**
 * Check if user is Admin
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if user has permission to access a resource
 */
export function hasPermission(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;

  // Super Admin has access to everything
  if (user.role === 'super_admin') return true;

  // Check if user's role matches required role
  return user.role === requiredRole;
}

/**
 * Get user from localStorage (client-side only)
 */
export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('token');
  const user = getStoredUser();

  return !!(token && user);
}
