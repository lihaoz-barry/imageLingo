'use client';

import { useState, useEffect } from 'react';
import { ImageFile } from './ImageThumbnails';

export interface ProcessingJob {
    id: string;
    imageFile: ImageFile;
    status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
    currentVariation: number;
    totalVariations: number;
    progress: number; // 0-100
    errorMessage?: string;
}

interface ProcessingQueueProps {
    jobs: ProcessingJob[];
    isVisible: boolean;
}

// Determine layout mode based on job count
type LayoutMode = 'large' | 'medium' | 'compact' | 'mini';

function getLayoutMode(jobCount: number): LayoutMode {
    if (jobCount <= 2) return 'large';
    if (jobCount <= 4) return 'medium';
    if (jobCount <= 8) return 'compact';
    return 'mini';
}

export function ProcessingQueue({ jobs, isVisible }: ProcessingQueueProps) {
    if (!isVisible || jobs.length === 0) return null;

    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const totalJobs = jobs.length;
    const layoutMode = getLayoutMode(totalJobs);

    return (
        <div
            className="mt-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 p-3"
            style={{
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)',
                maxHeight: '200px', // Fixed max height
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/90 font-medium text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Processing Queue
                </h3>
                <span className="text-white/50 text-xs">
                    {completedJobs}/{totalJobs} completed
                </span>
            </div>

            {/* Jobs Container - scrollable with fixed height */}
            <div
                className="overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: '150px' }}
            >
                {layoutMode === 'large' && (
                    <div className="space-y-2">
                        {jobs.map((job) => (
                            <JobItemLarge key={job.id} job={job} />
                        ))}
                    </div>
                )}

                {layoutMode === 'medium' && (
                    <div className="space-y-1.5">
                        {jobs.map((job) => (
                            <JobItemMedium key={job.id} job={job} />
                        ))}
                    </div>
                )}

                {layoutMode === 'compact' && (
                    <div className="grid grid-cols-2 gap-1.5">
                        {jobs.map((job) => (
                            <JobItemCompact key={job.id} job={job} />
                        ))}
                    </div>
                )}

                {layoutMode === 'mini' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {jobs.map((job) => (
                            <JobItemMini key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Custom hook for fake progress animation
function useFakeProgress(status: string): number {
    const [fakeProgress, setFakeProgress] = useState(0);

    useEffect(() => {
        // Handle terminal states with immediate timeout to avoid sync setState
        if (status === 'queued') {
            const timer = setTimeout(() => setFakeProgress(0), 0);
            return () => clearTimeout(timer);
        }

        if (status === 'done') {
            const timer = setTimeout(() => setFakeProgress(100), 0);
            return () => clearTimeout(timer);
        }

        if (status === 'error') {
            const timer = setTimeout(() => setFakeProgress(0), 0);
            return () => clearTimeout(timer);
        }

        // Animate progress for uploading/processing
        if (status === 'processing' || status === 'uploading') {
            const intervalMs = Math.random() * 300 + 300;

            const timer = setInterval(() => {
                setFakeProgress(prev => {
                    if (prev >= 95) return prev;
                    const increment = Math.random() * 3.5 + 1.5;
                    return Math.min(95, prev + increment);
                });
            }, intervalMs);

            return () => clearInterval(timer);
        }
    }, [status]);

    return fakeProgress;
}

// Helper functions for status
function getStatusColor(status: string) {
    switch (status) {
        case 'done': return 'text-green-400';
        case 'error': return 'text-red-400';
        default: return 'text-white/60';
    }
}

function getProgressBarColor(status: string) {
    switch (status) {
        case 'done': return 'bg-gradient-to-r from-green-500 to-emerald-400';
        case 'error': return 'bg-gradient-to-r from-red-500 to-rose-400';
        default: return 'bg-gradient-to-r from-cyan-500 to-violet-500';
    }
}

// Large layout: Full details with thumbnail, name, status, progress bar
function JobItemLarge({ job }: { job: ProcessingJob }) {
    const displayProgress = useFakeProgress(job.status);

    const getStatusText = () => {
        switch (job.status) {
            case 'queued': return 'Queued...';
            case 'uploading': return 'Uploading...';
            case 'processing': return `${job.currentVariation}/${job.totalVariations} variations`;
            case 'done': return `${job.totalVariations} variation${job.totalVariations > 1 ? 's' : ''} done`;
            case 'error': return job.errorMessage || 'Error';
            default: return '';
        }
    };

    return (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                <img
                    src={job.imageFile.preview}
                    alt={job.imageFile.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-white/80 text-xs truncate max-w-[140px]">
                        {job.imageFile.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {job.status === 'done' && <span className="text-green-400 text-xs">✓</span>}
                        {job.status === 'error' && <span className="text-red-400 text-xs">✕</span>}
                        <span className={`text-xs ${getStatusColor(job.status)}`}>
                            {getStatusText()}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(job.status)}`}
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// Medium layout: Smaller thumbnail, condensed info
function JobItemMedium({ job }: { job: ProcessingJob }) {
    const displayProgress = useFakeProgress(job.status);

    return (
        <div className="flex items-center gap-2 p-1 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
            {/* Thumbnail */}
            <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 bg-white/10">
                <img
                    src={job.imageFile.preview}
                    alt={job.imageFile.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white/70 text-[10px] truncate max-w-[100px]">
                        {job.imageFile.name}
                    </span>
                    <div className="flex items-center gap-1">
                        {job.status === 'done' && <span className="text-green-400 text-[10px]">✓</span>}
                        {job.status === 'error' && <span className="text-red-400 text-[10px]">✕</span>}
                        {job.status === 'processing' && (
                            <span className="text-white/50 text-[10px]">{job.currentVariation}/{job.totalVariations}</span>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(job.status)}`}
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// Compact layout: 2 columns, minimal info
function JobItemCompact({ job }: { job: ProcessingJob }) {
    const displayProgress = useFakeProgress(job.status);

    return (
        <div className="flex items-center gap-1.5 p-1 rounded bg-white/5 hover:bg-white/[0.07] transition-colors">
            {/* Tiny Thumbnail */}
            <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 bg-white/10 relative">
                <img
                    src={job.imageFile.preview}
                    alt={job.imageFile.name}
                    className="w-full h-full object-cover"
                />
                {job.status === 'done' && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <span className="text-white text-[8px]">✓</span>
                    </div>
                )}
                {job.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                        <span className="text-white text-[8px]">✕</span>
                    </div>
                )}
            </div>

            {/* Progress Bar only */}
            <div className="flex-1 min-w-0">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor(job.status)}`}
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// Mini layout: 3-4 columns, just thumbnail with overlay progress
function JobItemMini({ job }: { job: ProcessingJob }) {
    const displayProgress = useFakeProgress(job.status);

    return (
        <div className="relative rounded overflow-hidden bg-white/10 aspect-square">
            <img
                src={job.imageFile.preview}
                alt={job.imageFile.name}
                className="w-full h-full object-cover"
            />

            {/* Overlay progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div
                    className={`h-full transition-all duration-300 ${getProgressBarColor(job.status)}`}
                    style={{ width: `${displayProgress}%` }}
                />
            </div>

            {/* Status overlay */}
            {job.status === 'done' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold drop-shadow">✓</span>
                </div>
            )}
            {job.status === 'error' && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold drop-shadow">✕</span>
                </div>
            )}
            {(job.status === 'processing' || job.status === 'uploading') && (
                <div className="absolute top-0.5 right-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse block" />
                </div>
            )}
        </div>
    );
}
