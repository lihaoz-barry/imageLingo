import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateRequest, requireAuth } from '@/lib/auth-middleware';
import { NextRequest } from 'next/server';

// Mock the Supabase server client
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/lib/supabase-server';

describe('auth-middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateRequest', () => {
    it('should return authenticated: false if Supabase is not configured', async () => {
      vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateRequest(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Supabase not configured');
    });

    it('should return authenticated: false if user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateRequest(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Unauthorized - Invalid or missing authentication token');
    });

    it('should return authenticated: true with userId if user is authenticated', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateRequest(req);

      expect(result.authenticated).toBe(true);
      expect(result.userId).toBe(mockUserId);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(createSupabaseServerClient).mockRejectedValue(
        new Error('Connection failed')
      );

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await authenticateRequest(req);

      expect(result.authenticated).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('requireAuth', () => {
    it('should return 401 response if not authenticated', async () => {
      vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(req);

      expect(result.response).not.toBe(null);
      expect(result.userId).toBe(null);
      expect(result.response?.status).toBe(401);

      const json = await result.response?.json();
      expect(json.error).toBe('Supabase not configured');
    });

    it('should return userId if authenticated', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockUserId } },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/test');
      const result = await requireAuth(req);

      expect(result.response).toBe(null);
      expect(result.userId).toBe(mockUserId);
    });
  });
});
