'use client';

import { useState, useEffect, useRef } from 'react';
import { Wallet } from 'lucide-react';

const STORAGE_KEY = 'imagelingo_last_credits';
const ANIMATION_DURATION_MS = 5000; // 5 seconds

const DEBUG_ALWAYS_ANIMATE = false;

interface TokenButtonProps {
    tokenBalance: number;
    onClick?: () => void;
}

export function TokenButton({
    tokenBalance,
    onClick,
}: TokenButtonProps) {
    const [isAnimating, setIsAnimating] = useState(DEBUG_ALWAYS_ANIMATE);
    const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastKnownBalanceRef = useRef<number | null>(null);
    const hasInitializedRef = useRef(false);

    const triggerAnimation = () => {
        // Clear any existing timeout
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }

        // Use queueMicrotask to defer setState and avoid synchronous update in effect
        queueMicrotask(() => {
            // Start animation
            setIsAnimating(true);

            // Stop after 5 seconds (skip if debugging)
            if (!DEBUG_ALWAYS_ANIMATE) {
                animationTimeoutRef.current = setTimeout(() => {
                    setIsAnimating(false);
                }, ANIMATION_DURATION_MS);
            }
        });
    };

    // Check for credit increase and trigger animation
    useEffect(() => {
        // Skip if debugging always animate
        if (DEBUG_ALWAYS_ANIMATE) return;

        // Skip if tokenBalance is 0 (not yet loaded from auth)
        if (tokenBalance === 0) {
            return;
        }

        // First time we see a real (non-zero) balance
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;

            // Get the stored balance from localStorage
            const storedBalance = localStorage.getItem(STORAGE_KEY);

            if (storedBalance !== null) {
                const lastBalance = parseInt(storedBalance, 10);
                // Only animate if credits increased since last session
                if (!isNaN(lastBalance) && tokenBalance > lastBalance) {
                    triggerAnimation();
                }
            }
            // Store current balance and set as reference
            localStorage.setItem(STORAGE_KEY, tokenBalance.toString());
            lastKnownBalanceRef.current = tokenBalance;
            return;
        }

        // Subsequent balance changes within the same session
        if (lastKnownBalanceRef.current !== null && tokenBalance > lastKnownBalanceRef.current) {
            triggerAnimation();
        }

        // Update stored balance
        localStorage.setItem(STORAGE_KEY, tokenBalance.toString());
        lastKnownBalanceRef.current = tokenBalance;
    }, [tokenBalance]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current);
            }
        };
    }, []);

    // The glow layer is always rendered but with opacity control
    // This prevents layout shifts when animation starts/stops
    const showGlow = isAnimating;

    return (
        <div className="relative inline-block">
            {/* Rainbow Wave Glow with breathing brightness */}
            {showGlow && (
                <div
                    className="absolute inset-[-6px] rounded-full pointer-events-none"
                    style={{
                        background: 'linear-gradient(90deg, #00d4ff, #8b5cf6, #c026d3, #00d4ff, #8b5cf6, #c026d3, #00d4ff)',
                        backgroundSize: '200% 100%',
                        filter: 'blur(8px)',
                        animation: 'rainbow-shift 4s linear infinite, rainbow-breathe 2s ease-in-out infinite',
                    }}
                />
            )}

            {/* Static background to cover the glow behind button */}
            {showGlow && (
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
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
            </button>
        </div>
    );
}
