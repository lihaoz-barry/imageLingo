'use client';

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import type { ImageProcessingStats } from '@/app/api/admin/image-stats/route';

interface AdminImageStatsProps {
  isAdmin: boolean;
}

export default function AdminImageStats({ isAdmin }: AdminImageStatsProps) {
  const [stats, setStats] = useState<ImageProcessingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load stats on mount
  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/image-stats');

      if (!response.ok) {
        throw new Error('Failed to fetch image statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error loading image stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div>
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-xl font-semibold">Image Processing Statistics</h2>
        </div>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !stats && (
        <div className="p-12 text-center rounded-xl bg-white/5 border border-white/10">
          <p className="text-[#9ca3af]">Calculating image processing statistics...</p>
        </div>
      )}

      {/* Stats Display */}
      {stats && !loading && (
        <>
          {/* Overall Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Average Processing Time */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#9ca3af] text-sm mb-1">Avg Processing Time</p>
              <p className="text-2xl font-bold text-[#00d4ff]">
                {formatTime(stats.overallAvgTime)}
              </p>
              <p className="text-xs text-[#9ca3af] mt-2">
                {stats.totalProcessed} processed
              </p>
            </div>

            {/* Total Processed */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#9ca3af] text-sm mb-1">Total Processed</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.totalProcessed}
              </p>
              <p className="text-xs text-[#9ca3af] mt-2">completed generations</p>
            </div>

            {/* Total Failed */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#9ca3af] text-sm mb-1">Total Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.totalFailed}
              </p>
              <p className="text-xs text-[#9ca3af] mt-2">failed generations</p>
            </div>

            {/* Success Rate */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[#9ca3af] text-sm mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.totalProcessed + stats.totalFailed > 0
                  ? (
                      (stats.totalProcessed /
                        (stats.totalProcessed + stats.totalFailed)) *
                      100
                    ).toFixed(1)
                  : 'N/A'}
                %
              </p>
              <p className="text-xs text-[#9ca3af] mt-2">success percentage</p>
            </div>
          </div>

          {/* Per-Image Statistics */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-8">
            <h3 className="text-lg font-semibold mb-4">Per-Image Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-[#9ca3af] text-sm mb-2">Minimum Time</p>
                <p className="text-xl font-bold">{formatTime(stats.perImageStats.minTime)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-[#9ca3af] text-sm mb-2">Median Time</p>
                <p className="text-xl font-bold">{formatTime(stats.perImageStats.medianTime)}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5">
                <p className="text-[#9ca3af] text-sm mb-2">Maximum Time</p>
                <p className="text-xl font-bold">{formatTime(stats.perImageStats.maxTime)}</p>
              </div>
            </div>
          </div>

          {/* By Type Breakdown */}
          {stats.byType.length > 0 && (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Processing by Type</h3>
              <div className="space-y-3">
                {stats.byType.map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium capitalize mb-1">{type.type}</p>
                      <p className="text-sm text-[#9ca3af]">
                        {type.count} {type.count === 1 ? 'generation' : 'generations'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#00d4ff]">
                        {formatTime(type.avgTime)}
                      </p>
                      <p className="text-xs text-[#9ca3af]">average time</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Calculated Timestamp */}
          <p className="text-xs text-[#9ca3af] text-center mt-6">
            Last calculated: {new Date(stats.lastCalculatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
