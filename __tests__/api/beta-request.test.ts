import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/beta/request/route';
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

describe('POST /api/beta/request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/beta/request', {
      method: 'POST',
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 if user already has a request', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { 
            user: { 
              id: mockUserId, 
              email: 'test@example.com' 
            } 
          },
          error: null,
        }),
      },
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/beta/request', {
      method: 'POST',
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('already submitted');
  });

  it('should create beta request successfully', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRequestId = 'new-request-id';
    
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { 
            user: { 
              id: mockUserId, 
              email: 'test@example.com' 
            } 
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'beta_requests') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: mockRequestId,
                    status: 'pending',
                    created_at: '2024-01-01T00:00:00Z',
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {};
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/beta/request', {
      method: 'POST',
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.message).toContain('submitted successfully');
    expect(json.request.status).toBe('pending');
  });
});

describe('GET /api/beta/request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/beta/request');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return no request if user has not requested', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/beta/request');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.hasRequest).toBe(false);
  });

  it('should return request status if user has requested', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'request-id',
                status: 'pending',
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                credits_granted: 0,
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/beta/request');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.hasRequest).toBe(true);
    expect(json.request.status).toBe('pending');
  });
});
