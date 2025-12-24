import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * GET /api/images
 * List all images for a project
 * Query params: project_id (required)
 */
export async function GET(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return Response.json(
        { error: 'project_id query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', userId)
      .single();

    if (!project) {
      return Response.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json(
        { error: 'Failed to fetch images' },
        { status: 500 }
      );
    }

    return Response.json({ images });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/images
 * Upload a new image
 */
export async function POST(req: NextRequest) {
  const { response: authError, userId } = await requireAuth(req);
  if (authError) return authError;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('project_id') as string;

    if (!file) {
      return Response.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!projectId) {
      return Response.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return Response.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Verify user owns the project
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', userId)
      .single();

    if (!project) {
      return Response.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    // Validate file type (both extension and MIME type)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return Response.json(
        { error: 'Invalid file extension. Allowed: jpg, jpeg, png, gif, webp, svg' },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return Response.json(
        { error: 'Invalid MIME type. File must be a valid image.' },
        { status: 400 }
      );
    }

    // Generate unique file path with UUID for collision prevention
    const uniqueId = crypto.randomUUID();
    const fileName = `${userId}/${projectId}/${uniqueId}.${fileExt}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', {
        message: storageError.message,
        name: storageError.name,
        cause: storageError.cause,
        fileName,
        fileSize: file.size,
        fileType: file.type,
      });
      return Response.json(
        { error: `Failed to upload file to storage: ${storageError.message}` },
        { status: 500 }
      );
    }

    // Create image metadata record
    const { data: image, error: dbError } = await supabase
      .from('images')
      .insert({
        project_id: projectId,
        uploaded_by: userId,
        storage_path: storageData.path,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if DB insert fails
      try {
        await supabase.storage.from('images').remove([storageData.path]);
      } catch (cleanupError) {
        console.error('Failed to cleanup storage after DB error:', cleanupError);
      }
      return Response.json(
        { error: 'Failed to create image record' },
        { status: 500 }
      );
    }

    return Response.json({ image }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
