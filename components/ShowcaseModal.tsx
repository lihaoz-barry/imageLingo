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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop - Glass Version Only */}
            <div
                className="absolute inset-0 cursor-pointer bg-black/60 backdrop-blur-[20px]"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-2xl bg-[#0f0f2a]/90 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">


                {/* Close Button */}
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
                            <span className="text-xs font-medium text-[#00d4ff]">Discover ImageLingo</span>
                        </div>
                        <h3 className="text-2xl text-white font-bold mb-1">
                            Seamless Visual Localization
                        </h3>
                        <p className="text-sm text-[#9ca3af] max-w-lg mx-auto leading-relaxed">
                            Translate text while perfectly maintaining your original design.
                        </p>
                    </div>

                    {/* Image Slider - Enlarged */}
                    <div className="relative mb-6 bg-black/40 rounded-xl overflow-hidden max-w-xl mx-auto border border-white/5 shadow-inner">
                        <div className="max-h-[380px] min-h-[280px] w-full flex justify-center items-center overflow-hidden">
                            <ImageComparisonSlider
                                beforeImage={showcaseExamples[currentExample].before}
                                afterImage={showcaseExamples[currentExample].after}
                                beforeLabel={showcaseExamples[currentExample].beforeLabel}
                                afterLabel={showcaseExamples[currentExample].afterLabel}
                                aspectRatio={showcaseExamples[currentExample].aspectRatio}
                            />
                        </div>

                        {/* Navigation */}
                        {showcaseExamples.length > 1 && (
                            <div className="flex justify-center gap-2 py-3 bg-black/60 backdrop-blur-sm border-t border-white/5">
                                {showcaseExamples.map((example, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentExample(idx)}
                                        className={`px-4 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-bold transition-all border ${currentExample === idx
                                            ? 'bg-white text-black border-transparent scale-105 shadow-lg'
                                            : 'bg-white/5 text-[#9ca3af] hover:bg-white/10 border-white/10'
                                            }`}
                                    >
                                        {example.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center transition-transform hover:scale-[1.02]">
                            <div className="w-8 h-8 mx-auto rounded-full bg-[#8b5cf6]/20 flex items-center justify-center mb-2 border border-[#8b5cf6]/30">
                                <Globe className="w-4 h-4 text-[#8b5cf6]" />
                            </div>
                            <h4 className="text-white text-[11px] font-bold mb-0.5">30+ Languages</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">Global reach</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center transition-transform hover:scale-[1.02]">
                            <div className="w-8 h-8 mx-auto rounded-full bg-[#c026d3]/20 flex items-center justify-center mb-2 border border-[#c026d3]/30">
                                <LayoutGrid className="w-4 h-4 text-[#c026d3]" />
                            </div>
                            <h4 className="text-white text-[11px] font-bold mb-0.5">Layout Fixed</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">100% design-safe</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center transition-transform hover:scale-[1.02]">
                            <div className="w-8 h-8 mx-auto rounded-full bg-[#00d4ff]/20 flex items-center justify-center mb-2 border border-[#00d4ff]/30">
                                <Zap className="w-4 h-4 text-[#00d4ff]" />
                            </div>
                            <h4 className="text-white text-[11px] font-bold mb-0.5">AI Precision</h4>
                            <p className="text-[10px] text-[#9ca3af] leading-tight">Smart detection</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10 bg-[#050515]/80 backdrop-blur rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 rounded-xl bg-white text-black font-black text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                    >
                        GET STARTED
                    </button>
                </div>
            </div>
        </div>
    );
}
