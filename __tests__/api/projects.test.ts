import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/projects/route';
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

describe('GET /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return empty array if no projects', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.projects).toEqual([]);
  });

  it('should return projects list on success', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockProjects = [
      {
        id: 'proj-1',
        owner_id: mockUserId,
        name: 'Project 1',
        description: 'Test project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: mockProjects,
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects');
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.projects).toEqual(mockProjects);
  });
});

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    const mockResponse = Response.json({ error: 'Unauthorized' }, { status: 401 });
    vi.mocked(requireAuth).mockResolvedValue({
      response: mockResponse,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(401);
  });

  it('should return 400 if name is missing', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Project name is required');
  });

  it('should return 400 if name is empty string', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const req = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Project name is required');
  });

  it('should create project successfully', async () => {
    const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
    const mockProject = {
      id: 'proj-1',
      owner_id: mockUserId,
      name: 'New Project',
      description: 'Test description',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    vi.mocked(requireAuth).mockResolvedValue({
      response: null,
      userId: mockUserId,
    });

    const mockSupabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: mockProject,
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(mockSupabase as any);

    const req = new NextRequest('http://localhost:3000/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Project', description: 'Test description' }),
    });
    const response = await POST(req);

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.project).toEqual(mockProject);
  });
});
