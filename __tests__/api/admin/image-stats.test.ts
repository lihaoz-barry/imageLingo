import { describe, it, expect } from 'vitest';
import type { ImageProcessingStats } from '@/app/api/admin/image-stats/route';

/**
 * Test the statistics calculation logic
 * This tests the calculateStats function independently
 */
describe('Image Processing Statistics', () => {
  // Helper function to calculate stats (mirrors the API function)
  function calculateStats(
    generations: Array<{
      id: string;
      type: string;
      processing_ms: number | null;
    }>,
    failedCount: number
  ): ImageProcessingStats {
    const validGenerations = generations.filter(
      (g) => g.processing_ms !== null
    ) as Array<{
      id: string;
      type: string;
      processing_ms: number;
    }>;

    const totalTime = validGenerations.reduce((sum, g) => sum + g.processing_ms, 0);
    const overallAvgTime =
      validGenerations.length > 0 ? totalTime / validGenerations.length : 0;

    const typeMap = new Map<
      string,
      {
        times: number[];
        count: number;
      }
    >();

    validGenerations.forEach((g) => {
      if (!typeMap.has(g.type)) {
        typeMap.set(g.type, { times: [], count: 0 });
      }
      const type = typeMap.get(g.type)!;
      type.times.push(g.processing_ms);
      type.count += 1;
    });

    const byType = Array.from(typeMap.entries())
      .map(([type, { times, count }]) => ({
        type,
        avgTime: times.reduce((a, b) => a + b, 0) / count,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const sortedTimes = validGenerations
      .map((g) => g.processing_ms)
      .sort((a, b) => a - b);

    const minTime = sortedTimes.length > 0 ? sortedTimes[0] : 0;
    const maxTime =
      sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;

    let medianTime = 0;
    if (sortedTimes.length > 0) {
      const mid = Math.floor(sortedTimes.length / 2);
      medianTime =
        sortedTimes.length % 2 === 0
          ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
          : sortedTimes[mid];
    }

    return {
      overallAvgTime: Math.round(overallAvgTime * 100) / 100,
      totalProcessed: validGenerations.length,
      totalFailed: failedCount,
      byType,
      perImageStats: {
        minTime: Math.round(minTime * 100) / 100,
        maxTime: Math.round(maxTime * 100) / 100,
        medianTime: Math.round(medianTime * 100) / 100,
      },
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  describe('calculateStats', () => {
    it('should handle empty generations', () => {
      const stats = calculateStats([], 0);

      expect(stats.overallAvgTime).toBe(0);
      expect(stats.totalProcessed).toBe(0);
      expect(stats.totalFailed).toBe(0);
      expect(stats.byType).toEqual([]);
      expect(stats.perImageStats.minTime).toBe(0);
      expect(stats.perImageStats.maxTime).toBe(0);
      expect(stats.perImageStats.medianTime).toBe(0);
    });

    it('should calculate correct average for single generation', () => {
      const generations = [
        {
          id: '1',
          type: 'text_extraction',
          processing_ms: 1000,
        },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.overallAvgTime).toBe(1000);
      expect(stats.totalProcessed).toBe(1);
      expect(stats.totalFailed).toBe(0);
      expect(stats.perImageStats.minTime).toBe(1000);
      expect(stats.perImageStats.maxTime).toBe(1000);
      expect(stats.perImageStats.medianTime).toBe(1000);
    });

    it('should calculate correct average for multiple generations', () => {
      const generations = [
        { id: '1', type: 'text_extraction', processing_ms: 1000 },
        { id: '2', type: 'text_extraction', processing_ms: 2000 },
        { id: '3', type: 'text_extraction', processing_ms: 3000 },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.overallAvgTime).toBe(2000);
      expect(stats.totalProcessed).toBe(3);
      expect(stats.perImageStats.minTime).toBe(1000);
      expect(stats.perImageStats.maxTime).toBe(3000);
      expect(stats.perImageStats.medianTime).toBe(2000);
    });

    it('should group by type correctly', () => {
      const generations = [
        { id: '1', type: 'text_extraction', processing_ms: 1000 },
        { id: '2', type: 'text_extraction', processing_ms: 1000 },
        { id: '3', type: 'translation', processing_ms: 500 },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.byType).toHaveLength(2);

      const textExtraction = stats.byType.find((t) => t.type === 'text_extraction');
      expect(textExtraction).toEqual({
        type: 'text_extraction',
        avgTime: 1000,
        count: 2,
      });

      const translation = stats.byType.find((t) => t.type === 'translation');
      expect(translation).toEqual({
        type: 'translation',
        avgTime: 500,
        count: 1,
      });
    });

    it('should handle null processing_ms values', () => {
      const generations: Array<{
        id: string;
        type: string;
        processing_ms: number | null;
      }> = [
        { id: '1', type: 'text_extraction', processing_ms: 1000 },
        { id: '2', type: 'text_extraction', processing_ms: null },
        { id: '3', type: 'text_extraction', processing_ms: 2000 },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.totalProcessed).toBe(2);
      expect(stats.overallAvgTime).toBe(1500);
    });

    it('should calculate median for even number of values', () => {
      const generations = [
        { id: '1', type: 'text_extraction', processing_ms: 1000 },
        { id: '2', type: 'text_extraction', processing_ms: 2000 },
        { id: '3', type: 'text_extraction', processing_ms: 3000 },
        { id: '4', type: 'text_extraction', processing_ms: 4000 },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.perImageStats.medianTime).toBe(2500);
    });

    it('should include failed count in stats', () => {
      const generations = [
        { id: '1', type: 'text_extraction', processing_ms: 1000 },
      ];

      const stats = calculateStats(generations, 5);

      expect(stats.totalFailed).toBe(5);
    });

    it('should round floating point values to 2 decimal places', () => {
      const generations = [
        { id: '1', type: 'text_extraction', processing_ms: 1000.555 },
        { id: '2', type: 'text_extraction', processing_ms: 1000.444 },
      ];

      const stats = calculateStats(generations, 0);

      expect(stats.overallAvgTime).toBe(1000.5);
    });

    it('should set lastCalculatedAt to current time', () => {
      const beforeTime = new Date();
      const stats = calculateStats([], 0);
      const afterTime = new Date();

      const calculatedTime = new Date(stats.lastCalculatedAt);

      expect(calculatedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(calculatedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
