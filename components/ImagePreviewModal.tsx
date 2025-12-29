'use client';

import { useEffect, useCallback, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

interface ImagePreviewModalProps {
    isOpen: boolean;
    imageUrl: string;
    imageName: string;
    onClose: () => void;
}

export function ImagePreviewModal({
    isOpen,
    imageUrl,
    imageName,
    onClose,
}: ImagePreviewModalProps) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [zoomPosition, setZoomPosition] = useState<{ x: number; y: number } | null>(null);
    const [isZoomEnabled, setIsZoomEnabled] = useState(false);
    const [imageRect, setImageRect] = useState<DOMRect | null>(null);
    const [isMobileDevice, setIsMobileDevice] = useState(false);

    // Detect mobile device on mount
    useEffect(() => {
        setIsMobileDevice('ontouchstart' in window);
    }, []);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    // Handle direct download (fetch as blob to bypass cross-origin restrictions)
    const handleDownload = useCallback(async () => {
        if (!imageUrl) return;

        setIsDownloading(true);
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = imageName || 'translated-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab
            window.open(imageUrl, '_blank');
        } finally {
            setIsDownloading(false);
        }
    }, [imageUrl, imageName]);

    // Update image rect on image load and window resize
    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setImageRect(e.currentTarget.getBoundingClientRect());
    };

    // Common function to update zoom position based on coordinates
    const updateZoomPosition = useCallback((clientX: number, clientY: number) => {
        if (!isZoomEnabled || !imageRect) return;

        // Calculate position relative to the image, not the container
        const x = ((clientX - imageRect.left) / imageRect.width) * 100;
        const y = ((clientY - imageRect.top) / imageRect.height) * 100;

        // Only show lens if cursor is within image bounds
        if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
            setZoomPosition({ x, y });
        } else {
            setZoomPosition(null);
        }
    }, [isZoomEnabled, imageRect]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        updateZoomPosition(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
        setZoomPosition(null);
    };

    // Touch event handlers for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isZoomEnabled || e.touches.length === 0) return;
        const touch = e.touches[0];
        updateZoomPosition(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isZoomEnabled || e.touches.length === 0) return;
        e.preventDefault(); // Prevent page scrolling
        const touch = e.touches[0];
        updateZoomPosition(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = () => {
        setZoomPosition(null);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal Content */}
            <div
                className="relative z-10 w-full max-w-[98vw] h-full max-h-[98vh] flex flex-col items-center justify-center gap-4 p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top Controls */}
                <div className="absolute top-4 right-4 z-50 flex gap-2">
                    <button
                        onClick={() => setIsZoomEnabled(!isZoomEnabled)}
                        className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 ${isZoomEnabled
                            ? 'bg-[#8b5cf6] text-white hover:bg-[#7c3aed]'
                            : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white'
                            }`}
                        title="Toggle Zoom"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                        </svg>
                        <span className="text-sm font-medium">Zoom</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        aria-label="Close preview"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Image Container with Zoom */}
                <div
                    className={`relative flex-1 min-h-0 w-full flex items-center justify-center overflow-hidden ${isZoomEnabled ? 'cursor-crosshair' : ''}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <img
                        src={imageUrl}
                        alt={imageName}
                        onLoad={handleImageLoad}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />

                    {/* Zoom Lens */}
                    {/* Touch indicator for mobile */}
                    {isZoomEnabled && zoomPosition && isMobileDevice && (
                        <div
                            className="absolute w-4 h-4 rounded-full bg-[#8b5cf6] border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${zoomPosition.x}%`,
                                top: `${zoomPosition.y}%`,
                                zIndex: 70
                            }}
                        />
                    )}
                    {/* Zoom Pane (Static) */}
                    {isZoomEnabled && zoomPosition && (
                        <div
                            className={`absolute pointer-events-none rounded-2xl border-2 border-white/20 shadow-2xl bg-no-repeat overflow-hidden bg-black/50 backdrop-blur-sm ${
                                isMobileDevice 
                                    ? 'bottom-4 left-1/2 -translate-x-1/2 w-64 h-64' 
                                    : 'top-4 left-4 w-80 h-80'
                            }`}
                            style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                backgroundSize: '300%', // 3x zoom
                                zIndex: 60
                            }}
                        />
                    )}
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all duration-300 flex items-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative z-50"
                >
                    {isDownloading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                    <span>{isDownloading ? 'Downloading...' : 'Download Image'}</span>
                </button>
            </div>
        </div>
    );
}
