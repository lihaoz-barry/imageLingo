import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH, DELETE } from '@/app/api/projects/[id]/route';
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

describe('GET /api/projects/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'proj-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should return 404 if project not found', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Project not found');
  });

  it('should return project on success', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockProject = {
      id: 'proj-1',
      name: 'Test Project',
      owner_id: mockUserId,
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: mockProject,
                error: null,
              }),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1');
    const response = await GET(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.project).toEqual(mockProject);
  });
});

describe('PATCH /api/projects/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'proj-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'New Name' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 400 if name is invalid', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: '' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid project name');
  });

  it('should return 400 if no valid fields to update', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('No valid fields to update');
  });

  it('should update project successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const updatedProject = {
      id: 'proj-1',
      name: 'Updated Project',
      owner_id: mockUserId,
    };

    const mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: updatedProject,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Project' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.project.name).toBe('Updated Project');
  });

  it('should return 404 if project not found or update failed', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' },
                }),
              })),
            })),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Project' }),
    });
    const response = await PATCH(req, { params: mockParams });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('Project not found or update failed');
  });
});

describe('DELETE /api/projects/[id]', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockParams = Promise.resolve({ id: 'proj-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(401);
  });

  it('should return 500 if Supabase is not configured', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Supabase not configured');
  });

  it('should delete project successfully', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe('Project deleted successfully');
  });

  it('should return 500 if delete fails', async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: { message: 'Delete failed' },
            }),
          })),
        })),
      })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects/proj-1', {
      method: 'DELETE',
    });
    const response = await DELETE(req, { params: mockParams });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Failed to delete project');
  });
});
