import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/images/[id]
 * Get a specific image by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get image with project info to verify access
    const { data: image, error } = await supabase
      .from('images')
      .select('*, projects!inner(owner_id)')
      .eq('id', id)
      .single();

    if (error || !image) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify user owns the project
    if (image.projects.owner_id !== userId) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get signed URL for the image
    const { data: signedUrl } = await supabase.storage
      .from('images')
      .createSignedUrl(image.storage_path, 3600); // 1 hour expiry

    return Response.json({
      image: {
        ...image,
        url: signedUrl?.signedUrl || null,
      },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[id]
 * Delete an image
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get image to verify access and get storage path
    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('*, projects!inner(owner_id)')
      .eq('id', id)
      .single();

    if (fetchError || !image) {
      return Response.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Verify user owns the project
    if (image.projects.owner_id !== userId) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete from database first
    const { error: deleteError } = await supabase
      .from('images')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return Response.json(
        { error: 'Failed to delete image' },
        { status: 500 }
      );
    }

    // Delete from storage (best effort)
    try {
      await supabase.storage.from('images').remove([image.storage_path]);
    } catch (storageError) {
      console.error('Failed to delete image from storage:', storageError);
      // Continue - database record is already deleted
    }

    return Response.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
