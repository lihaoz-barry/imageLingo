import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/history/route';
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

describe('GET /api/history', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return empty history for users with no completed generations', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              })),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.history).toEqual([]);
  });

  it('should return history with signed URLs', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGenerations = [
      {
        id: 'gen-1',
        type: 'translation',
        status: 'completed',
        source_language: 'en',
        target_language: 'es',
        tokens_used: 1,
        processing_ms: 2500,
        created_at: '2024-01-01T00:00:00Z',
        input_image_id: 'img-1',
        output_image_id: 'img-2',
      },
    ];

    const mockInputImage = {
      id: 'img-1',
      storage_path: 'user/input.png',
      original_filename: 'input.png',
    };

    const mockOutputImage = {
      id: 'img-2',
      storage_path: 'user/output.png',
      original_filename: 'output.png',
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn().mockResolvedValue({
                      data: mockGenerations,
                      error: null,
                    }),
                  })),
                })),
              })),
            })),
          };
        }
        if (table === 'images') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn((field: string, value: string) => ({
                single: vi.fn().mockResolvedValue({
                  data: value === 'img-1' ? mockInputImage : mockOutputImage,
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      }),
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

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.history).toHaveLength(1);
    expect(json.history[0].id).toBe('gen-1');
    expect(json.history[0].type).toBe('translation');
    expect(json.history[0].status).toBe('completed');
    expect(json.history[0].source_language).toBe('en');
    expect(json.history[0].target_language).toBe('es');
    expect(json.history[0].input_image).toBeDefined();
    expect(json.history[0].output_image).toBeDefined();
  });

  it('should handle generations without images gracefully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGenerations = [
      {
        id: 'gen-1',
        type: 'translation',
        status: 'completed',
        source_language: 'en',
        target_language: 'es',
        tokens_used: 1,
        processing_ms: 2500,
        created_at: '2024-01-01T00:00:00Z',
        input_image_id: null,
        output_image_id: null,
      },
    ];

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: mockGenerations,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: null },
          }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.history).toHaveLength(1);
    expect(json.history[0].input_image).toBeNull();
    expect(json.history[0].output_image).toBeNull();
  });

  it('should return 500 on database error', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database error' },
                }),
              })),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch history');
  });

  it('should use default tokens_used of 1 when not set', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGenerations = [
      {
        id: 'gen-1',
        type: 'translation',
        status: 'completed',
        source_language: 'en',
        target_language: 'es',
        tokens_used: null, // Not set
        processing_ms: 2500,
        created_at: '2024-01-01T00:00:00Z',
        input_image_id: null,
        output_image_id: null,
      },
    ];

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({
                  data: mockGenerations,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      })),
      storage: {
        from: vi.fn(() => ({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: null },
          }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/history');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.history[0].tokens_used).toBe(1);
  });
});
