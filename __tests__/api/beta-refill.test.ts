import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/beta-refill/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/admin-middleware', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { requireAdmin } from '@/lib/admin-middleware';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

describe('POST /api/admin/beta-refill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated as admin', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAdmin).mockResolvedValue({
      response: mockResponse,
      userId: null,
      email: null,
    });

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'test-id',
        creditsToRefill: 50,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid request ID', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      response: null,
      userId: 'admin-123',
      email: 'admin@example.com',
    });

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: null,
        creditsToRefill: 50,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid request ID');
  });

  it('should return 400 for invalid credits amount', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      response: null,
      userId: 'admin-123',
      email: 'admin@example.com',
    });

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'test-id',
        creditsToRefill: -10,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Credits must be a positive number');
  });

  it('should return 404 if beta request not found', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      response: null,
      userId: 'admin-123',
      email: 'admin@example.com',
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'non-existent-id',
        creditsToRefill: 50,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Beta request not found');
  });

  it('should return 400 if request is not approved', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      response: null,
      userId: 'admin-123',
      email: 'admin@example.com',
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-id',
                user_id: 'user-123',
                email: 'user@example.com',
                status: 'pending',
                credits_granted: 0,
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: 'test-id',
        creditsToRefill: 50,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Can only refill tokens for approved requests');
  });

  it('should successfully refill tokens for approved request', async () => {
    const mockUserId = 'user-123';
    const mockRequestId = 'request-456';
    const creditsToRefill = 50;
    const existingCredits = 100;
    const existingLimit = 200;

    vi.mocked(requireAdmin).mockResolvedValue({
      response: null,
      userId: 'admin-123',
      email: 'admin@example.com',
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'beta_requests') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: mockRequestId,
                    user_id: mockUserId,
                    email: 'user@example.com',
                    status: 'approved',
                    credits_granted: existingCredits,
                  },
                  error: null,
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          };
        } else if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'sub-123',
                    generations_limit: existingLimit,
                  },
                  error: null,
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            })),
          };
        }
        return {};
      }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseAdminClient).mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/admin/beta-refill', {
      method: 'POST',
      body: JSON.stringify({
        requestId: mockRequestId,
        creditsToRefill: creditsToRefill,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('Credits refilled successfully');
    expect(json.creditsRefilled).toBe(creditsToRefill);
    expect(json.totalCreditsGranted).toBe(existingCredits + creditsToRefill);
    expect(json.newCreditLimit).toBe(existingLimit + creditsToRefill);
  });
});
