import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/generations/route';
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

describe('GET /api/generations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/generations?project_id=123');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 if project_id is missing', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/generations');
    const response = await GET(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('project_id query parameter is required');
  });

  it('should return generations list on success', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockGenerations = [
      {
        id: 'gen-1',
        project_id: 'proj-1',
        user_id: mockUserId,
        type: 'text_extraction',
        status: 'completed',
        prompt: null,
        input_image_id: 'img-1',
        output_text: 'Extracted text',
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
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn().mockResolvedValue({
                  data: mockGenerations,
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

    const req = new NextRequest('http://localhost:3000/api/generations?project_id=proj-1');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.generations).toEqual(mockGenerations);
  });
});

describe('POST /api/generations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if project_id is missing', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/generations', {
      method: 'POST',
      body: JSON.stringify({ type: 'text_extraction' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('project_id is required');
  });

  it('should return 400 if type is invalid', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/generations', {
      method: 'POST',
      body: JSON.stringify({ project_id: 'proj-1', type: 'invalid_type' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Valid type is required');
  });

  it('should create generation successfully', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockGeneration = {
      id: 'gen-1',
      project_id: 'proj-1',
      user_id: mockUserId,
      type: 'text_extraction',
      status: 'pending',
      input_image_id: 'img-1',
      created_at: '2024-01-01T00:00:00Z',
    };

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
        if (table === 'generations') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: mockGeneration,
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

    const req = new NextRequest('http://localhost:3000/api/generations', {
      method: 'POST',
      body: JSON.stringify({
        project_id: 'proj-1',
        type: 'text_extraction',
        input_image_id: 'img-1',
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.generation).toEqual(mockGeneration);
  });
});
