'use client';

import { useState } from 'react';
import { Wallet, Sparkles } from 'lucide-react';

type AnimationStyle = 'none' | 'edge-spin' | 'pulse' | 'rainbow';

interface TokenButtonProps {
    tokenBalance: number;
    onClick?: () => void;
    /** When true, shows animation demo selector */
    showAnimationDemo?: boolean;
}

export function TokenButton({
    tokenBalance,
    onClick,
    showAnimationDemo = false,
}: TokenButtonProps) {
    const [demoAnimation, setDemoAnimation] = useState<AnimationStyle>('none');

    const isAnimating = showAnimationDemo && demoAnimation !== 'none';

    return (
        <div className="flex items-center gap-4">
            {/* Animation Demo Selector */}
            {showAnimationDemo && (
                <select
                    value={demoAnimation}
                    onChange={(e) => setDemoAnimation(e.target.value as AnimationStyle)}
                    className="bg-[#1a1a2e] text-white text-xs rounded px-2 py-1 border border-[#8b5cf6]/30"
                >
                    <option value="none">No Animation</option>
                    <option value="edge-spin">Edge Spin Glow</option>
                    <option value="pulse">Pulse Glow</option>
                    <option value="rainbow">Rainbow Wave</option>
                </select>
            )}

            <div className="relative">
                {/* Edge Spin Glow Animation */}
                {isAnimating && demoAnimation === 'edge-spin' && (
                    <div
                        className="absolute inset-[-4px] rounded-full animate-[spin_2s_linear_infinite]"
                        style={{
                            background: 'conic-gradient(from 0deg, #00d4ff, #8b5cf6, #c026d3, transparent 60%)',
                            filter: 'blur(6px)',
                            opacity: 0.9,
                        }}
                    />
                )}

                {/* Pulse Glow Animation */}
                {isAnimating && demoAnimation === 'pulse' && (
                    <div
                        className="absolute inset-[-6px] rounded-full animate-pulse"
                        style={{
                            background: 'radial-gradient(ellipse, rgba(0, 212, 255, 0.6), rgba(139, 92, 246, 0.4), transparent 70%)',
                            filter: 'blur(8px)',
                        }}
                    />
                )}

                {/* Rainbow Wave Animation */}
                {isAnimating && demoAnimation === 'rainbow' && (
                    <div
                        className="absolute inset-[-6px] rounded-full"
                        style={{
                            background: 'linear-gradient(90deg, #00d4ff, #8b5cf6, #c026d3, #00d4ff)',
                            backgroundSize: '300% 100%',
                            filter: 'blur(8px)',
                            opacity: 0.85,
                            animation: 'rainbow-shift 2s ease-in-out infinite',
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
        </div>
    );
}
