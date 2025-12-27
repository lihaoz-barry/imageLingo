import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateAdmin, requireAdmin, isAdminEmail } from '@/lib/admin-middleware';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { createSupabaseServerClient } from '@/lib/supabase-server';

describe('Admin Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateAdmin', () => {
    it('should return error if Supabase is not configured', async () => {
      vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

      const result = await authenticateAdmin();

      expect(result.authenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.error).toBe('Supabase not configured');
    });

    it('should return error if user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const result = await authenticateAdmin();

      expect(result.authenticated).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('Unauthorized');
    });

    it('should return authenticated but not admin for non-admin user', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { 
              user: { 
                id: mockUserId, 
                email: 'regular@example.com' 
              } 
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const result = await authenticateAdmin();

      expect(result.authenticated).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('should return authenticated and admin for admin user', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { 
              user: { 
                id: mockUserId, 
                email: 'lihaoz0214@gmail.com' 
              } 
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const result = await authenticateAdmin();

      expect(result.authenticated).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.userId).toBe(mockUserId);
      expect(result.email).toBe('lihaoz0214@gmail.com');
      expect(result.error).toBeUndefined();
    });
  });

  describe('requireAdmin', () => {
    it('should return 401 if not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Unauthorized'),
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await requireAdmin(req);

      expect(result.response).not.toBeNull();
      expect(result.userId).toBeNull();
      if (result.response) {
        expect(result.response.status).toBe(401);
      }
    });

    it('should return 403 if authenticated but not admin', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { 
              user: { 
                id: mockUserId, 
                email: 'regular@example.com' 
              } 
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await requireAdmin(req);

      expect(result.response).not.toBeNull();
      expect(result.userId).toBeNull();
      if (result.response) {
        expect(result.response.status).toBe(403);
      }
    });

    it('should return success for admin user', async () => {
      const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { 
              user: { 
                id: mockUserId, 
                email: 'lihaoz0214@gmail.com' 
              } 
            },
            error: null,
          }),
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const req = new NextRequest('http://localhost:3000/api/admin/test');
      const result = await requireAdmin(req);

      expect(result.response).toBeNull();
      expect(result.userId).toBe(mockUserId);
      expect(result.email).toBe('lihaoz0214@gmail.com');
    });
  });

  describe('isAdminEmail', () => {
    it('should return true for admin email', () => {
      expect(isAdminEmail('lihaoz0214@gmail.com')).toBe(true);
    });

    it('should return false for non-admin email', () => {
      expect(isAdminEmail('regular@example.com')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isAdminEmail(null)).toBe(false);
      expect(isAdminEmail(undefined)).toBe(false);
    });
  });
});
