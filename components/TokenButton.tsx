'use client';

import { Wallet, Sparkles } from 'lucide-react';

interface TokenButtonProps {
    tokenBalance: number;
    onClick?: () => void;
}

export function TokenButton({
    tokenBalance,
    onClick,
}: TokenButtonProps) {
    // Always animate for demo/preview
    const isAnimating = true;

    return (
        <div className="relative">
            {/* Rainbow Wave Glow with breathing brightness */}
            {isAnimating && (
                <div
                    className="absolute inset-[-6px] rounded-full"
                    style={{
                        background: 'linear-gradient(90deg, #00d4ff, #8b5cf6, #c026d3, #00d4ff, #8b5cf6, #c026d3, #00d4ff)',
                        backgroundSize: '200% 100%',
                        filter: 'blur(8px)',
                        animation: 'rainbow-shift 4s linear infinite, rainbow-breathe 2s ease-in-out infinite',
                    }}
                />
            )}

            {/* Static background to cover the glow behind button */}
            {isAnimating && (
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'linear-gradient(135deg, rgba(13, 13, 43, 0.98), rgba(45, 27, 105, 0.98))',
                    }}
                />
            )}

            {/* Actual button */}
            <button
                onClick={onClick}
                className="relative z-10 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30 hover:from-[#8b5cf6]/30 hover:to-[#c026d3]/30 transition-all"
            >
                <Wallet className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-white text-sm sm:text-base">{tokenBalance.toLocaleString()}</span>
                <span className="text-xs text-[#9ca3af] hidden sm:inline">tokens</span>
                {isAnimating && (
                    <Sparkles className="w-3 h-3 text-[#00d4ff] animate-pulse" />
                )}
            </button>
        </div>
    );
}
