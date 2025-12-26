import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/generations/[id]/route';
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

describe('GET /api/generations/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'gen-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if generation not found', async () => {
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

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Generation not found');
  });

  it('should return 403 if user does not own the project', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGeneration = {
      id: 'gen-1',
      type: 'translation',
      projects: { owner_id: 'different-user-id' },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockGeneration,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Access denied');
  });

  it('should return generation on success', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGeneration = {
      id: 'gen-1',
      type: 'translation',
      status: 'completed',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockGeneration,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.generation.id).toBe('gen-1');
    expect(json.generation.type).toBe('translation');
  });
});

describe('PATCH /api/generations/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'gen-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if generation not found or access denied', async () => {
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

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Generation not found or access denied');
  });

  it('should return 400 if no valid fields to update', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockGeneration = {
      id: 'gen-1',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockGeneration,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('No valid fields to update');
  });

  it('should update generation successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const existingGeneration = {
      id: 'gen-1',
      projects: { owner_id: mockUserId },
    };

    const updatedGeneration = {
      id: 'gen-1',
      status: 'completed',
      tokens_used: 1,
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: existingGeneration,
                  error: null,
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: updatedGeneration,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed', tokens_used: 1 }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.generation.status).toBe('completed');
  });

  it('should return 500 if update fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const existingGeneration = {
      id: 'gen-1',
      projects: { owner_id: mockUserId },
    };

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: existingGeneration,
                  error: null,
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Update failed' },
                  }),
                })),
              })),
            })),
          };
        }
        return {};
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/generations/gen-1', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to update generation');
  });
});
