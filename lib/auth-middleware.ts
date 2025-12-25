import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export interface AuthenticatedRequest extends NextRequest {
  userId: string;
}

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
}

/**
 * Authenticate a request using Supabase JWT token
 * Returns the user ID if authenticated, or an error response
 */
export async function authenticateRequest(): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseServerClient();

    if (!supabase) {
      return {
        authenticated: false,
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
        error: 'Unauthorized - Invalid or missing authentication token',
      };
    }

    return {
      authenticated: true,
      userId: user.id,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    console.error('Authentication error:', error);
    return {
      authenticated: false,
      error: errorMessage,
    };
  }
}

/**
 * Middleware helper to require authentication
 * Returns Response with 401 if not authenticated, otherwise returns null
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ response: Response; userId: null } | { response: null; userId: string }> {
  const authResult = await authenticateRequest();

  if (!authResult.authenticated) {
    return {
      response: Response.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return {
    response: null,
    userId: authResult.userId!,
  };
}
