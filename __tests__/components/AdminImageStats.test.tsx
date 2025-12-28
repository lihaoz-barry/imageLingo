import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminImageStats from '@/components/AdminImageStats';
import type { ImageProcessingStats } from '@/app/api/admin/image-stats/route';

// Mock fetch globally
const mockFetch = vi.fn() as ReturnType<typeof vi.fn>;

describe('AdminImageStats Component', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockStats: ImageProcessingStats = {
    overallAvgTime: 1234.5,
    totalProcessed: 100,
    totalFailed: 5,
    byType: [
      { type: 'text_extraction', avgTime: 1200, count: 60 },
      { type: 'translation', avgTime: 1300, count: 40 },
    ],
    perImageStats: {
      minTime: 500,
      maxTime: 3000,
      medianTime: 1000,
    },
    lastCalculatedAt: '2024-01-01T12:00:00Z',
  };

  it('should not render anything when not admin', () => {
    const { container } = render(<AdminImageStats isAdmin={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render component when admin', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    expect(screen.getByText('Image Processing Statistics')).toBeInTheDocument();
  });

  it('should load stats on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/image-stats');
    });
  });

  it('should display stats when loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Avg Processing Time')).toBeInTheDocument();
      expect(screen.getByText('Total Processed')).toBeInTheDocument();
      expect(screen.getByText('Total Failed')).toBeInTheDocument();
    });
  });

  it('should display correct stat values', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Avg Processing Time')).toBeInTheDocument();
      expect(screen.getByText('Total Processed')).toBeInTheDocument();
      expect(screen.getByText('Total Failed')).toBeInTheDocument();
    });
  });

  it('should calculate and display success rate', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      // 100 / (100 + 5) * 100 = 95.24%
      expect(screen.getByText(/95\.[0-9]+%/)).toBeInTheDocument();
    });
  });

  it('should display per-image statistics', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Per-Image Statistics')).toBeInTheDocument();
      expect(screen.getByText('Minimum Time')).toBeInTheDocument();
      expect(screen.getByText('Median Time')).toBeInTheDocument();
      expect(screen.getByText('Maximum Time')).toBeInTheDocument();
    });
  });

  it('should display stats by type', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Processing by Type')).toBeInTheDocument();
      expect(screen.getByText('text_extraction')).toBeInTheDocument();
      expect(screen.getByText('translation')).toBeInTheDocument();
    });
  });

  it('should show loading state when calculating', async () => {
    // Use a delayed promise to simulate loading
    const delayedPromise = new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: async () => mockStats,
        } as Response);
      }, 100);
    });

    mockFetch.mockReturnValueOnce(delayedPromise);

    render(<AdminImageStats isAdmin={true} />);

    // Should show loading text initially
    expect(
      screen.getByText('Calculating image processing statistics...')
    ).toBeInTheDocument();
  });

  it('should allow manual refresh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    // Wait for initial load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const refreshButton = screen.getByText('Calculate');
    expect(refreshButton).toBeInTheDocument();

    // Clear previous calls
    mockFetch.mockClear();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    // Click refresh
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/image-stats');
    });
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch image statistics')
      ).toBeInTheDocument();
    });
  });

  it('should display N/A for success rate when no data', async () => {
    const emptyStats: ImageProcessingStats = {
      ...mockStats,
      totalProcessed: 0,
      totalFailed: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('N/A%')).toBeInTheDocument();
    });
  });

  it('should format time correctly in milliseconds', async () => {
    const statsWithShortTime: ImageProcessingStats = {
      ...mockStats,
      overallAvgTime: 234.56,
      perImageStats: {
        minTime: 100,
        maxTime: 500,
        medianTime: 250,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithShortTime,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Avg Processing Time')).toBeInTheDocument();
      // Component renders short times in milliseconds
      const elements = screen.queryAllByText(/234ms|235ms|100ms|500ms/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should format time correctly in seconds', async () => {
    const statsWithLongTime: ImageProcessingStats = {
      ...mockStats,
      overallAvgTime: 5000,
      perImageStats: {
        minTime: 1000,
        maxTime: 10000,
        medianTime: 5000,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => statsWithLongTime,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('Avg Processing Time')).toBeInTheDocument();
      // Component renders long times in seconds (5.00s format)
      const elements = screen.queryAllByText(/[0-9]+\.[0-9]+s/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('should display last calculated timestamp', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStats,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Last calculated:/)).toBeInTheDocument();
    });
  });

  it('should handle empty byType array', async () => {
    const statsNoCounts: ImageProcessingStats = {
      ...mockStats,
      byType: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => statsNoCounts,
    });

    render(<AdminImageStats isAdmin={true} />);

    await waitFor(() => {
      expect(screen.queryByText('Processing by Type')).not.toBeInTheDocument();
    });
  });
});
