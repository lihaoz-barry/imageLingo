'use client';

import { useState } from 'react';
import { X, Mail, Sparkles, Gift, Copy, Check, MessageSquare } from 'lucide-react';
import { SUPPORT_EMAIL, BETA_MAX_CREDITS } from '@/lib/config';
import { FeedbackDialog } from './FeedbackDialog';

interface BetaFeedbackPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentTokens: number;
    userEmail?: string;
}

export function BetaFeedbackPanel({ isOpen, onClose, currentTokens, userEmail }: BetaFeedbackPanelProps) {
    const [copied, setCopied] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    if (!isOpen) return null;

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(SUPPORT_EMAIL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = SUPPORT_EMAIL;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const creditRequestSubject = 'ImageLingo - Credit Request';
    const creditRequestBody = `Hi,\n\nI would like to request ${BETA_MAX_CREDITS} free credits.\n\nAccount: ${userEmail || '[Your email]'}\n\nThank you!`;

    const handleRequestCredits = () => {
        const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(creditRequestSubject)}&body=${encodeURIComponent(creditRequestBody)}`;
        window.open(mailtoUrl, '_self');
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-gradient-to-b from-[#0d0d2b] to-[#1a1a4a] border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-white/10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent">
                            ImageLingo Beta
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Current Balance */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                            <Gift className="w-6 h-6 text-[#00d4ff]" />
                            <span className="text-lg text-[#9ca3af]">Your Credits</span>
                        </div>
                        <span className="text-3xl font-bold text-white">{currentTokens}</span>
                    </div>

                    {/* Simple Message */}
                    <div className="text-center">
                        <p className="text-xl text-white font-medium leading-relaxed">
                            Send email to request<br />
                            <span className="text-[#00d4ff] font-bold">{BETA_MAX_CREDITS} free credits</span>
                        </p>
                    </div>

                    {/* Email Display with Copy */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Mail className="w-5 h-5 text-[#8b5cf6] flex-shrink-0" />
                            <span className="text-white font-mono text-base truncate">{SUPPORT_EMAIL}</span>
                        </div>
                        <button
                            onClick={handleCopyEmail}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Request Credits Link - Using <a> tag for reliable mailto */}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(creditRequestSubject)}&body=${encodeURIComponent(creditRequestBody)}`}
                            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all text-white font-bold text-lg shadow-lg hover:shadow-[#8b5cf6]/25 active:scale-[0.98] no-underline"
                        >
                            <Mail className="w-5 h-5" />
                            Request Credits
                        </a>

                        {/* Feedback Button */}
                        <button
                            onClick={() => setIsFeedbackOpen(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[#9ca3af] hover:text-white"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Share Feedback
                        </button>
                    </div>
                </div>
            </div>

            {/* Shared Feedback Dialog */}
            <FeedbackDialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen} />
        </>
    );
}
