'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Globe, Zap, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface ShowcaseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const showcaseExamples = [
    {
        before: '/images/showcase/product-cn.jpg',
        after: '/images/showcase/product-en.jpg',
        beforeLabel: 'Chinese',
        afterLabel: 'English',
        title: 'Product Packaging',
        aspectRatio: 'aspect-square md:aspect-[4/3]',
    },
    {
        before: '/images/showcase/menu-en.png',
        after: '/images/showcase/menu-fr.jpg',
        beforeLabel: 'English',
        afterLabel: 'French',
        title: 'Restaurant Menus',
        aspectRatio: 'aspect-square md:aspect-[4/3]',
    },
];

export function ShowcaseModal({ isOpen, onClose }: ShowcaseModalProps) {
    const [currentExample, setCurrentExample] = useState(0);

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-[#0f0f2a] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30 mb-4">
                            <Sparkles className="w-4 h-4 text-[#00d4ff]" />
                            <span className="text-sm text-[#00d4ff]">See ImageLingo in Action</span>
                        </div>
                        <h3 className="text-3xl text-white font-bold mb-3">
                            Transform Images Across Languages
                        </h3>
                        <p className="text-[#9ca3af] max-w-2xl mx-auto">
                            Drag the slider to see how ImageLingo translates text while preserving your original design and layout perfectly
                        </p>
                    </div>

                    {/* Slider content */}
                    <div className="relative mb-8 max-w-2xl mx-auto">
                        <ImageComparisonSlider
                            beforeImage={showcaseExamples[currentExample].before}
                            afterImage={showcaseExamples[currentExample].after}
                            beforeLabel={showcaseExamples[currentExample].beforeLabel}
                            afterLabel={showcaseExamples[currentExample].afterLabel}
                            aspectRatio={showcaseExamples[currentExample].aspectRatio}
                        />

                        {/* Example Navigation */}
                        {showcaseExamples.length > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {showcaseExamples.map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentExample(idx)}
                                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${currentExample === idx
                                            ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white border-transparent'
                                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10 border-white/10'
                                            }`}
                                    >
                                        {example.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-white font-medium mb-1">30+ Languages</h4>
                            <p className="text-sm text-[#9ca3af]">
                                Support for all major languages with auto-detection
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                                <LayoutGrid className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-white font-medium mb-1">Layout Preserved</h4>
                            <p className="text-sm text-[#9ca3af]">
                                Maintains original design, fonts, and positioning
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#8b5cf6]/30 transition-colors">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="text-white font-medium mb-1">AI-Powered</h4>
                            <p className="text-sm text-[#9ca3af]">
                                Advanced AI for accurate translation and rendering
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 rounded-full bg-white text-[#0f0f2a] font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-white/20"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
