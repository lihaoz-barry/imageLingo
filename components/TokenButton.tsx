'use client';

import { useState, useEffect, useRef } from 'react';
import { Wallet, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'imagelingo_last_credits';
const ANIMATION_DURATION_MS = 5000; // 5 seconds

interface TokenButtonProps {
    tokenBalance: number;
    onClick?: () => void;
}

export function TokenButton({
    tokenBalance,
    onClick,
}: TokenButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);

    // Check for credit increase and trigger animation
    useEffect(() => {
        // Skip on first render to avoid animation on page load with existing balance
        if (isFirstRender.current) {
            isFirstRender.current = false;
            // Store initial balance
            const storedBalance = localStorage.getItem(STORAGE_KEY);
            if (storedBalance === null) {
                // First time - just store, don't animate
                localStorage.setItem(STORAGE_KEY, tokenBalance.toString());
            } else {
                const lastBalance = parseInt(storedBalance, 10);
                // If credits increased since last visit, animate!
                if (!isNaN(lastBalance) && tokenBalance > lastBalance) {
                    triggerAnimation();
                }
                // Update stored balance
                localStorage.setItem(STORAGE_KEY, tokenBalance.toString());
            }
            return;
        }

        // On subsequent balance changes, check if increased
        const lastBalance = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
        if (tokenBalance > lastBalance) {
            triggerAnimation();
        }
        // Always update stored balance
        localStorage.setItem(STORAGE_KEY, tokenBalance.toString());
    }, [tokenBalance]);

    const triggerAnimation = () => {
        // Clear any existing timeout
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }

        // Start animation
        setIsAnimating(true);

        // Stop after 5 seconds
        animationTimeoutRef.current = setTimeout(() => {
            setIsAnimating(false);
        }, ANIMATION_DURATION_MS);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

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
