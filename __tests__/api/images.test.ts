import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/images/route';
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

describe('GET /api/images', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/images?project_id=123');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 if project_id is missing', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/images');
    const response = await GET(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('project_id query parameter is required');
  });

  it('should return 404 if project not found', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images?project_id=proj-1');
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Project not found or access denied');
  });

  it('should return images list on success', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockImages = [
      {
        id: 'img-1',
        project_id: 'proj-1',
        uploaded_by: mockUserId,
        storage_path: 'images/test.png',
        original_filename: 'test.png',
        mime_type: 'image/png',
        file_size_bytes: 1024,
        width: 800,
        height: 600,
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'proj-1' },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === 'images') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: mockImages,
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/images?project_id=proj-1');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.images).toEqual(mockImages);
  });
});
