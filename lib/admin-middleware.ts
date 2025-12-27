import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Admin email whitelist
 * SECURITY: Only this email has admin access to beta requests dashboard and approval APIs
 * This is the owner's email and should never be exposed in client-side code
 */
const ADMIN_EMAIL = 'lihaoz0214@gmail.com';

export interface AdminAuthResult {
  authenticated: boolean;
  isAdmin: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

/**
 * Authenticate an admin request
 * SECURITY: This middleware ensures only the admin email can access admin routes
 * Used for:
 * - /api/admin/beta-requests (list all beta requests)
 * - /api/admin/beta-approve (approve beta requests)
 * 
 * @returns AdminAuthResult with authentication and admin status
 */
export async function authenticateAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        authenticated: false,
        isAdmin: false,
        error: 'Supabase not configured',
      };
    }

    // Get the authenticated user from the session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        authenticated: false,
        isAdmin: false,
        error: 'Unauthorized - Invalid or missing authentication token',
      };
    }

    // Check if user email matches admin email
    const isAdmin = user.email === ADMIN_EMAIL;

    if (!isAdmin) {
      return {
        authenticated: true,
        isAdmin: false,
        userId: user.id,
        email: user.email || undefined,
        error: 'Forbidden - Admin access required',
      };
    }

    return {
      authenticated: true,
      isAdmin: true,
      userId: user.id,
      email: user.email || undefined,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Admin authentication error:', error);
    return {
      authenticated: false,
      isAdmin: false,
      error: errorMessage,
    };
  }
}

/**
 * Middleware helper to require admin authentication
 * Returns Response with 401/403 if not authenticated/authorized as admin
 * 
 * SECURITY NOTE: This enforces that only lihaoz0214@gmail.com can access admin routes.
 * Never expose user lists, email addresses, or request status to non-admin users.
 */
export async function requireAdmin(
  _req: NextRequest
): Promise<
  | { response: Response; userId: null; email: null }
  | { response: null; userId: string; email: string }
> {
  const authResult = await authenticateAdmin();

  if (!authResult.authenticated) {
    return {
      response: Response.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      ),
      userId: null,
      email: null,
    };
  }

  if (!authResult.isAdmin) {
    return {
      response: Response.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      ),
      userId: null,
      email: null,
    };
  }

  return {
    response: null,
    userId: authResult.userId!,
    email: authResult.email!,
  };
}

/**
 * Check if an email is the admin email
 * This is a helper function for client-side checks
 * SECURITY: While this can be used client-side, actual authorization
 * must always be enforced server-side via requireAdmin()
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL;
}
