import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/subscriptions/route';
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

describe('GET /api/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 404 if subscription not found', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
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
              error: new Error('Not found'),
            }),
          })),
        })),
      })),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Subscription not found');
  });

  it('should return subscription on success', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockSubscription = {
      id: 'sub-1',
      user_id: mockUserId,
      plan: 'free',
      status: 'active',
      generations_used: 5,
      generations_limit: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockSubscription,
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/subscriptions');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.subscription).toEqual(mockSubscription);
  });
});
