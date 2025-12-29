import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/translate/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth-middleware', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  translateImage: vi.fn(),
  GeminiError: class GeminiError extends Error {
    code: string;
    retryable: boolean;
    constructor(message: string, code: string, retryable: boolean) {
      super(message);
      this.code = code;
      this.retryable = retryable;
    }
  },
}));

import { requireAuth } from '@/lib/auth-middleware';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { translateImage, GeminiError } from '@/lib/gemini';

describe('POST /api/translate', () => {
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 if generation_id is missing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('generation_id is required');
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 402 if subscription not found', async () => {
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(402);
    const json = await response.json();
    expect(json.error).toContain('Subscription not found');
  });

  it('should return 402 if insufficient credits', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                user_id: mockUserId,
                generations_limit: 10,
                generations_used: 10, // No credits left
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(402);
    const json = await response.json();
    expect(json.error).toContain('Insufficient credits');
  });

  it('should return 404 if generation not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Generation not found');
  });

  it('should return 403 if user does not own the generation', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gen-1',
                    status: 'pending',
                    projects: { owner_id: 'different-user-id' }, // Different owner
                    images: { storage_path: 'path/to/image.png' },
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe('Access denied');
  });

  it('should return 400 if generation is not pending', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gen-1',
                    status: 'completed', // Already completed
                    projects: { owner_id: mockUserId },
                    images: { storage_path: 'path/to/image.png' },
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('already completed');
  });

  it('should return 400 if input image is missing', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gen-1',
                    status: 'pending',
                    projects: { owner_id: mockUserId },
                    images: null, // No input image
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

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Input image not found');
  });

  it('should return 429 on Gemini rate limit error', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockUpdateFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 0,
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gen-1',
                    project_id: 'proj-1',
                    status: 'pending',
                    source_language: 'en',
                    target_language: 'es',
                    projects: { owner_id: mockUserId },
                    images: {
                      storage_path: 'path/to/image.png',
                      mime_type: 'image/png',
                      original_filename: 'test.png',
                    },
                  },
                  error: null,
                }),
              })),
            })),
            update: mockUpdateFn,
          };
        }
        if (table === 'error_logs') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      }),
      storage: {
        from: vi.fn(() => ({
          download: vi.fn().mockResolvedValue({
            data: {
              arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
            },
            error: null,
          }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    // Mock Gemini rate limit error
    const rateLimitError = new GeminiError('Rate limit exceeded', 'RATE_LIMIT', true);
    vi.mocked(translateImage).mockRejectedValue(rateLimitError);

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.retryable).toBe(true);
  });

  it('should process translation successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockUpdateFn = vi.fn().mockImplementation(() => ({
      eq: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockImplementation(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'gen-1',
              status: 'completed',
              output_image_id: 'output-img-1',
            },
            error: null,
          }),
        })),
      })),
    }));

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    user_id: mockUserId,
                    generations_limit: 10,
                    generations_used: 5,
                  },
                  error: null,
                }),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          };
        }
        if (table === 'generations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'gen-1',
                    project_id: 'proj-1',
                    status: 'pending',
                    source_language: 'en',
                    target_language: 'es',
                    projects: { owner_id: mockUserId },
                    images: {
                      storage_path: 'path/to/image.png',
                      mime_type: 'image/png',
                      original_filename: 'test.png',
                    },
                  },
                  error: null,
                }),
              })),
            })),
            update: mockUpdateFn,
          };
        }
        if (table === 'images') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'output-img-1' },
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
          download: vi.fn().mockResolvedValue({
            data: {
              arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
            },
            error: null,
          }),
          upload: vi.fn().mockResolvedValue({ error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({
            data: { signedUrl: 'https://example.com/signed-url' },
          }),
        })),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    // Mock successful translation
    vi.mocked(translateImage).mockResolvedValue({
      imageBuffer: Buffer.from('translated-image'),
      mimeType: 'image/png',
    });

    const req = new NextRequest('http://localhost:3000/api/translate', {
      method: 'POST',
      body: JSON.stringify({ generation_id: 'gen-1' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.generation).toBeDefined();
    expect(json.credits_balance).toBe(4); // 10 - 5 - 1 = 4
  });
});
