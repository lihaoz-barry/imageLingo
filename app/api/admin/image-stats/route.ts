import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export interface ImageProcessingStats {
  overallAvgTime: number; // Average processing time across all images (ms)
  totalProcessed: number;
  totalFailed: number;
  byType: {
    type: string;
    avgTime: number;
    count: number;
  }[];
  perImageStats: {
    minTime: number;
    maxTime: number;
    medianTime: number;
  };
  lastCalculatedAt: string;
}

/**
 * GET /api/admin/image-stats
 *
 * ADMIN-ONLY ENDPOINT
 * Calculates and returns statistics about image processing performance.
 * This endpoint computes average processing times on-demand when called.
 *
 * SECURITY & PRIVACY:
 * - Only accessible to admin email (lihaoz0214@gmail.com)
 * - Uses admin client to bypass RLS and aggregate all generations
 *
 * STATISTICS COMPUTED:
 * - Overall average processing time across all completed generations
 * - Total processed and failed generation counts
 * - Average time by processing type (text_extraction, translation, etc)
 * - Per-image statistics (min, max, median processing times)
 * - Last calculation timestamp
 *
 * @returns 200 with statistics object, 401/403 for unauthorized/forbidden
 */
export async function GET(req: NextRequest) {
  // SECURITY: Admin-only access control
  const { response: authError } = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase admin not configured' },
        { status: 500 }
      );
    }

    // Fetch all completed generations with timing and type information
    const { data: generations, error: fetchError } = await supabase
      .from('generations')
      .select('id, type, status, processing_ms, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching generations:', fetchError);
      return Response.json(
        { error: 'Failed to fetch generation data' },
        { status: 500 }
      );
    }

    // Fetch failed generations for count
    const { data: failedGenerations, error: failedError } = await supabase
      .from('generations')
      .select('id')
      .eq('status', 'failed');

    if (failedError) {
      console.error('Error fetching failed generations:', failedError);
      return Response.json(
        { error: 'Failed to fetch failed generation count' },
        { status: 500 }
      );
    }

    const stats = calculateStats(generations || [], failedGenerations?.length || 0);

    return Response.json(stats, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Admin image stats calculation error:', error);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Internal function to calculate statistics from generation records
 */
function calculateStats(
  generations: Array<{
    id: string;
    type: string;
    processing_ms: number | null;
  }>,
  failedCount: number
): ImageProcessingStats {
  // Filter out null processing times
  const validGenerations = generations.filter((g) => g.processing_ms !== null) as Array<{
    id: string;
    type: string;
    processing_ms: number;
  }>;

  // Calculate overall average
  const totalTime = validGenerations.reduce((sum, g) => sum + g.processing_ms, 0);
  const overallAvgTime = validGenerations.length > 0 ? totalTime / validGenerations.length : 0;

  // Group by type and calculate averages
  const typeMap = new Map<
    string,
    {
      times: number[];
      count: number;
    }
  >();

  validGenerations.forEach((g) => {
    if (!typeMap.has(g.type)) {
      typeMap.set(g.type, { times: [], count: 0 });
    }
    const type = typeMap.get(g.type)!;
    type.times.push(g.processing_ms);
    type.count += 1;
  });

  const byType = Array.from(typeMap.entries())
    .map(([type, { times, count }]) => ({
      type,
      avgTime: times.reduce((a, b) => a + b, 0) / count,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate per-image statistics
  const sortedTimes = validGenerations
    .map((g) => g.processing_ms)
    .sort((a, b) => a - b);

  const minTime = sortedTimes.length > 0 ? sortedTimes[0] : 0;
  const maxTime = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;

  let medianTime = 0;
  if (sortedTimes.length > 0) {
    const mid = Math.floor(sortedTimes.length / 2);
    medianTime =
      sortedTimes.length % 2 === 0
        ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
        : sortedTimes[mid];
  }

  return {
    overallAvgTime: Math.round(overallAvgTime * 100) / 100,
    totalProcessed: validGenerations.length,
    totalFailed: failedCount,
    byType,
    perImageStats: {
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      medianTime: Math.round(medianTime * 100) / 100,
    },
    lastCalculatedAt: new Date().toISOString(),
  };
}
