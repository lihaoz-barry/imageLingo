import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from '@/app/api/images/[id]/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth-middleware', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';

describe('GET /api/images/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'img-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/images/img-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/images/img-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if image not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Image not found');
  });

  it('should return 403 if user does not own the project', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockImage = {
      id: 'img-1',
      storage_path: 'user/image.png',
      projects: { owner_id: 'different-user-id' },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockImage,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Access denied');
  });

  it('should return image with signed URL on success', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockImage = {
      id: 'img-1',
      storage_path: 'user/image.png',
      original_filename: 'test.png',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockImage,
              error: null,
            }),
          })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: 'https://example.com/signed-url' },
          }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.image.id).toBe('img-1');
    expect(json.image.url).toBe('https://example.com/signed-url');
  });
});

describe('DELETE /api/images/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'img-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if image not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Image not found');
  });

  it('should return 403 if user does not own the project', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockImage = {
      id: 'img-1',
      storage_path: 'user/image.png',
      projects: { owner_id: 'different-user-id' },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockImage,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Access denied');
  });

  it('should delete image successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockImage = {
      id: 'img-1',
      storage_path: 'user/image.png',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'images') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockImage,
                  error: null,
                }),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            })),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn(() => ({
          remove: vi.fn().mockResolvedValue({ error: null }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('Image deleted successfully');
  });

  it('should return 500 if database delete fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockImage = {
      id: 'img-1',
      storage_path: 'user/image.png',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'images') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockImage,
                  error: null,
                }),
              })),
            })),
            delete: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                error: { message: 'Delete failed' },
              }),
            })),
          };
        }
        return {};
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images/img-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to delete image');
  });
});
