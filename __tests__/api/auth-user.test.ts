import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/user/route';
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

describe('GET /api/auth/user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/user');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/auth/user');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if user not found', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('User not found'),
        }),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/auth/user');
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('User not found');
  });

  it('should return user profile on success', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUser = {
      id: mockUserId,
      email: 'test@example.com',
    };
    const mockProfile = {
      id: mockUserId,
      display_name: 'Test User',
      avatar_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/auth/user');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.user).toMatchObject({
      id: mockUserId,
      email: 'test@example.com',
      display_name: 'Test User',
    });
  });
});
