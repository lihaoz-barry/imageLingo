import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/beta-requests
 * 
 * ADMIN-ONLY ENDPOINT
 * Lists all beta token requests with user information.
 * 
 * SECURITY & PRIVACY:
 * - Only accessible to admin email (lihaoz0214@gmail.com)
 * - Uses admin client to bypass RLS and view all requests
 * - Never expose this endpoint or its data to regular users
 * - This route should not be indexed or linked from public pages
 * 
 * @returns 200 with list of requests, 401/403 for unauthorized/forbidden
 */
export async function GET(req: NextRequest) {
  // SECURITY: Admin-only access control
  const { response: authError } = await requireAdmin(req);
  if (authError) return authError;

  try {
    // Use admin client to bypass RLS and see all requests
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    // Fetch all beta requests with user profile information
    // Order by created_at DESC to show newest first
    // Note: Using select('*') to avoid errors if optional columns don't exist yet
    const { data: requests, error: fetchError } = await supabase
      .from('beta_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching beta requests:', fetchError);
      return Response.json(
        { error: 'Failed to fetch beta requests' },
        { status: 500 }
      );
    }

    // Get user profiles for additional information
    const userIds = requests?.map(r => r.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    // Merge profile data with requests
    const enrichedRequests = requests?.map(request => {
      const profile = profiles?.find(p => p.id === request.user_id);
      return {
        ...request,
        display_name: profile?.display_name || 'Unknown',
        avatar_url: profile?.avatar_url,
      };
    });

    return Response.json(
      {
        requests: enrichedRequests || [],
        total: enrichedRequests?.length || 0,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin beta requests fetch error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
