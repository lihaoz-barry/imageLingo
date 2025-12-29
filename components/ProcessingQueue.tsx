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

export function ProcessingQueue({ jobs, isVisible }: ProcessingQueueProps) {
    if (!isVisible || jobs.length === 0) return null;

    const completedJobs = jobs.filter(j => j.status === 'done').length;
    const totalJobs = jobs.length;

    return (
        <div
            className="mt-6 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 p-3"
            style={{
                boxShadow: '0 0 30px rgba(0, 212, 255, 0.1)',
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

            {/* Jobs List - with max height and scroll */}
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {jobs.map((job) => (
                    <JobItem key={job.id} job={job} />
                ))}
            </div>
        </div>
    );
}

// Custom hook for fake progress animation
function useFakeProgress(status: string): number {
    const [fakeProgress, setFakeProgress] = useState(0);

    useEffect(() => {
        if (status === 'queued') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFakeProgress(0);
            return;
        }

        if (status === 'done') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFakeProgress(100);
            return;
        }

        if (status === 'error') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFakeProgress(0);
            return;
        }

        // Animate progress for uploading/processing
        if (status === 'processing' || status === 'uploading') {
            // Target: reach ~95% in about 20 seconds
            // Average increment: ~4% per update
            // Average interval: ~400ms -> 50 updates in 20 seconds
            const intervalMs = Math.random() * 300 + 300; // 300-600ms

            const timer = setInterval(() => {
                setFakeProgress(prev => {
                    if (prev >= 95) return prev;
                    // Randomized increment between 1.5% and 5%
                    const increment = Math.random() * 3.5 + 1.5;
                    return Math.min(95, prev + increment);
                });
            }, intervalMs);

            return () => clearInterval(timer);
        }
    }, [status]);

    return fakeProgress;
}

function JobItem({ job }: { job: ProcessingJob }) {
    const displayProgress = useFakeProgress(job.status);

    const getStatusText = () => {
        switch (job.status) {
            case 'queued':
                return 'Queued...';
            case 'uploading':
                return 'Uploading...';
            case 'processing':
                return `Variation ${job.currentVariation}/${job.totalVariations}`;
            case 'done':
                return `${job.totalVariations} variation${job.totalVariations > 1 ? 's' : ''} completed`;
            case 'error':
                return job.errorMessage || 'Error';
            default:
                return '';
        }
    };

    const getStatusColor = () => {
        switch (job.status) {
            case 'done':
                return 'text-green-400';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-white/60';
        }
    };

    const getProgressBarColor = () => {
        switch (job.status) {
            case 'done':
                return 'bg-gradient-to-r from-green-500 to-emerald-400';
            case 'error':
                return 'bg-gradient-to-r from-red-500 to-rose-400';
            default:
                return 'bg-gradient-to-r from-cyan-500 to-violet-500';
        }
    };

    return (
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors">
            {/* Thumbnail */}
            <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-white/10">
                <img
                    src={job.imageFile.preview}
                    alt={job.imageFile.name}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className="text-white/80 text-xs truncate max-w-[120px]">
                        {job.imageFile.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                        {job.status === 'done' && (
                            <span className="text-green-400 text-xs">✓</span>
                        )}
                        {job.status === 'error' && (
                            <span className="text-red-400 text-xs">✕</span>
                        )}
                        <span className={`text-xs ${getStatusColor()}`}>
                            {getStatusText()}
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
