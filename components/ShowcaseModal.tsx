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

            {/* Modal Container - Flex column to handle fixed footer */}
            <div className="relative w-full max-w-2xl bg-[#0f0f2a] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[85vh]">
                {/* Close Button - Absolute top right */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Header */}
                    <div className="text-center mb-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-[#00d4ff]" />
                            <span className="text-xs font-medium text-[#00d4ff]">See ImageLingo in Action</span>
                        </div>
                        <h3 className="text-2xl text-white font-bold mb-1">
                            Translate & Preserve Layout
                        </h3>
                        <p className="text-sm text-[#9ca3af] max-w-lg mx-auto leading-relaxed">
                            Drag the slider to see how we maintain your original design perfectly
                        </p>
                    </div>

                    {/* Compact Image Slider Area */}
                    <div className="relative mb-5 bg-black/20 rounded-xl overflow-hidden max-w-lg mx-auto">
                        <div className="max-h-[280px] w-full flex justify-center items-center overflow-hidden">
                            <ImageComparisonSlider
                                beforeImage={showcaseExamples[currentExample].before}
                                afterImage={showcaseExamples[currentExample].after}
                                beforeLabel={showcaseExamples[currentExample].beforeLabel}
                                afterLabel={showcaseExamples[currentExample].afterLabel}
                                aspectRatio={showcaseExamples[currentExample].aspectRatio}
                            />
                        </div>

                        {/* Example Navigation */}
                        {showcaseExamples.length > 1 && (
                            <div className="flex justify-center gap-2 py-2 bg-[#0f0f2a]/80 backdrop-blur">
                                {showcaseExamples.map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentExample(idx)}
                                        className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-all border ${currentExample === idx
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

                    {/* Features Grid - Very Compact */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-1.5">
                                <Globe className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-white text-xs font-medium mb-0.5">30+ Languages</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">
                                Auto-detect & translate
                            </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-1.5">
                                <LayoutGrid className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-white text-xs font-medium mb-0.5">Layout Safe</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">
                                Preserves designs
                            </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
                            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-1.5">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="text-white text-xs font-medium mb-0.5">AI Powered</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">
                                High accuracy
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0f0f2a] rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-white to-gray-200 text-[#0f0f2a] font-bold text-sm hover:translate-y-[-1px] transition-all shadow-lg hover:shadow-white/20 active:translate-y-[0px]"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
