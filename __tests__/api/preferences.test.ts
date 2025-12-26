import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/preferences/route';
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

describe('GET /api/preferences', () => {
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

    const req = new NextRequest('http://localhost:3000/api/preferences');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/preferences');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return default preferences for new users', async () => {
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
              error: { code: 'PGRST116' }, // No rows returned
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source_language).toBe('auto');
    expect(json.target_language).toBe('en');
    expect(json.variations_per_image).toBe(1);
  });

  it('should return user preferences when they exist', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockPreferences = {
      source_language: 'zh',
      target_language: 'es',
      variations_per_image: 3,
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockPreferences,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source_language).toBe('zh');
    expect(json.target_language).toBe('es');
    expect(json.variations_per_image).toBe(3);
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
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences');
    const response = await GET(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to fetch preferences');
  });
});

describe('POST /api/preferences', () => {
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

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ source_language: 'en' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ source_language: 'en' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 400 if variations_per_image is invalid (too low)', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({})),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ variations_per_image: 0 }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('variations_per_image must be between 1 and 5');
  });

  it('should return 400 if variations_per_image is invalid (too high)', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({})),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ variations_per_image: 10 }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('variations_per_image must be between 1 and 5');
  });

  it('should return 400 if variations_per_image is not a number', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({})),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ variations_per_image: 'invalid' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('variations_per_image must be between 1 and 5');
  });

  it('should save preferences successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const savedPreferences = {
      source_language: 'zh',
      target_language: 'es',
      variations_per_image: 3,
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: savedPreferences,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({
        source_language: 'zh',
        target_language: 'es',
        variations_per_image: 3,
      }),
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source_language).toBe('zh');
    expect(json.target_language).toBe('es');
    expect(json.variations_per_image).toBe(3);
  });

  it('should use defaults for missing fields', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const savedPreferences = {
      source_language: 'auto',
      target_language: 'en',
      variations_per_image: 1,
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: savedPreferences,
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({}), // Empty body
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.source_language).toBe('auto');
    expect(json.target_language).toBe('en');
    expect(json.variations_per_image).toBe(1);
  });

  it('should return 500 on database error', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/preferences', {
      method: 'POST',
      body: JSON.stringify({ source_language: 'en' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to save preferences');
  });
});
