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
    // Error tracking fields
    errorCode?: string; // Error code from API (e.g., RATE_LIMIT, TIMEOUT, etc.)
    isRetryable?: boolean; // Whether this error can be retried
    retryCount?: number; // Number of retry attempts made
    failedVariations?: Array<{
        variationNumber: number;
        errorCode: string;
        errorMessage: string;
        isRetryable: boolean;
        attemptNumber: number; // Which attempt failed (1, 2, 3)
    }>;
}

interface ProcessingQueueProps {
    jobs: ProcessingJob[];
    isVisible: boolean;
    onRetryVariation?: (jobId: string, variationNumber: number) => Promise<void>;
}

// Determine layout mode based on job count
type LayoutMode = 'large' | 'medium' | 'compact' | 'mini';

function getLayoutMode(jobCount: number): LayoutMode {
    if (jobCount <= 2) return 'large';
    if (jobCount <= 4) return 'medium';
    if (jobCount <= 8) return 'compact';
    return 'mini';
}

export function ProcessingQueue({ jobs, isVisible, onRetryVariation }: ProcessingQueueProps) {
    if (!isVisible || jobs.length === 0) return null;

    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const totalJobs = jobs.length;
    const layoutMode = getLayoutMode(totalJobs);

    return (
        <div
            className="mt-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 p-3"
            style={{
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)',
                maxHeight: '400px', // Increased to show error details
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
                style={{ maxHeight: '350px' }}
            >
                {layoutMode === 'large' && (
                    <div className="space-y-2">
                        {jobs.map((job) => (
                            <JobItemLarge key={job.id} job={job} onRetryVariation={onRetryVariation} />
                        ))}
                    </div>
                )}

                {layoutMode === 'medium' && (
                    <div className="space-y-1.5">
                        {jobs.map((job) => (
                            <JobItemMedium key={job.id} job={job} onRetryVariation={onRetryVariation} />
                        ))}
                    </div>
                )}

                {layoutMode === 'compact' && (
                    <div className="grid grid-cols-2 gap-1.5">
                        {jobs.map((job) => (
                            <JobItemCompact key={job.id} job={job} onRetryVariation={onRetryVariation} />
                        ))}
                    </div>
                )}

                {layoutMode === 'mini' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                        {jobs.map((job) => (
                            <JobItemMini key={job.id} job={job} onRetryVariation={onRetryVariation} />
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
function JobItemLarge({ job, onRetryVariation }: { job: ProcessingJob; onRetryVariation?: (jobId: string, varNum: number) => Promise<void> }) {
    const displayProgress = useFakeProgress(job.status);
    const [isRetrying, setIsRetrying] = useState(false);

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

    const handleRetry = async (variationNumber: number) => {
        if (!onRetryVariation) return;
        try {
            setIsRetrying(true);
            await onRetryVariation(job.id, variationNumber);
        } finally {
            setIsRetrying(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
            {/* Main job item */}
            <div className="flex items-center gap-2">
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

            {/* Failed variations details */}
            {job.failedVariations && job.failedVariations.length > 0 && (
                <div className="ml-12 space-y-1">
                    {job.failedVariations.map((failedVar) => (
                        <div key={`${job.id}-failed-${failedVar.variationNumber}`} className="bg-red-500/10 border border-red-500/30 rounded p-1.5">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                    <span className="text-red-300 text-[10px] font-medium">
                                        Variation {failedVar.variationNumber}: {failedVar.errorCode}
                                    </span>
                                    <p className="text-red-400/80 text-[9px] truncate">
                                        {failedVar.errorMessage}
                                    </p>
                                </div>
                                {failedVar.isRetryable && (
                                    <button
                                        onClick={() => handleRetry(failedVar.variationNumber)}
                                        disabled={isRetrying}
                                        className="flex-shrink-0 px-2 py-1 bg-cyan-500/30 hover:bg-cyan-500/50 disabled:opacity-50 text-cyan-300 text-[9px] rounded transition-colors"
                                    >
                                        {isRetrying ? 'Retrying...' : 'Retry'}
                                    </button>
                                )}
                            </div>
                            <span className="text-white/40 text-[8px]">Attempt {failedVar.attemptNumber}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Medium layout: Smaller thumbnail, condensed info
function JobItemMedium({ job, onRetryVariation }: { job: ProcessingJob; onRetryVariation?: (jobId: string, varNum: number) => Promise<void> }) {
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
function JobItemCompact({ job, onRetryVariation }: { job: ProcessingJob; onRetryVariation?: (jobId: string, varNum: number) => Promise<void> }) {
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
function JobItemMini({ job, onRetryVariation }: { job: ProcessingJob; onRetryVariation?: (jobId: string, varNum: number) => Promise<void> }) {
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
