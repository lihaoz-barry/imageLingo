import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/preferences
 * Get the current user's preferences
 */
export async function GET(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('source_language, target_language, variations_per_image')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for new users
      console.error('Error fetching preferences:', error);
      return Response.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return preferences or defaults
    return Response.json({
      source_language: preferences?.source_language ?? 'auto',
      target_language: preferences?.target_language ?? 'en',
      variations_per_image: preferences?.variations_per_image ?? 1,
    });
  } catch (error) {
    console.error('Error in preferences GET:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 * Save the current user's preferences
 */
export async function POST(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { source_language, target_language, variations_per_image } = body;

    // Validate variations_per_image
    if (
      variations_per_image !== undefined &&
      (typeof variations_per_image !== 'number' ||
        variations_per_image < 1 ||
        variations_per_image > 5)
    ) {
      return Response.json(
        { error: 'variations_per_image must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Upsert preferences (insert or update)
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          source_language: source_language ?? 'auto',
          target_language: target_language ?? 'en',
          variations_per_image: variations_per_image ?? 1,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error saving preferences:', error);
      return Response.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }

    return Response.json({
      source_language: data.source_language,
      target_language: data.target_language,
      variations_per_image: data.variations_per_image,
    });
  } catch (error) {
    console.error('Error in preferences POST:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
