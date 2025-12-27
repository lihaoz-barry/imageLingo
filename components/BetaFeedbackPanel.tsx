'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Sparkles, Gift, Copy, Check, MessageSquare, Loader2, Clock, CheckCircle } from 'lucide-react';
import { SUPPORT_EMAIL, BETA_CREDITS_PER_REQUEST } from '@/lib/config';
import { toast } from 'sonner';
import { FeedbackDialog } from './FeedbackDialog';

interface BetaFeedbackPanelProps {
    isOpen: boolean;
    onClose: () => void;
    currentTokens: number;
    userEmail?: string;
}

type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export function BetaFeedbackPanel({ isOpen, onClose, currentTokens, userEmail }: BetaFeedbackPanelProps) {
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestStatus, setRequestStatus] = useState<RequestStatus>('none');
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [message, setMessage] = useState('');

    // Check existing request status when panel opens
    useEffect(() => {
        if (isOpen) {
            checkRequestStatus();
        }
    }, [isOpen]);

    const checkRequestStatus = async () => {
        setIsLoadingStatus(true);
        try {
            const response = await fetch('/api/beta/request');
            const data = await response.json();

            if (data.hasRequest && data.request) {
                setRequestStatus(data.request.status as RequestStatus);
            } else {
                setRequestStatus('none');
            }
        } catch (error) {
            console.error('Failed to check request status:', error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const handleRequestCredits = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/beta/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message.trim() || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 400 && data.error?.includes('already submitted')) {
                    toast.info('You have already submitted a request. Please wait for approval.');
                    setRequestStatus('pending');
                } else {
                    throw new Error(data.error || 'Failed to submit request');
                }
                return;
            }

            toast.success('Credit request submitted! We will review it shortly.');
            setRequestStatus('pending');
            setMessage('');
        } catch (error) {
            console.error('Error requesting credits:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const renderRequestButton = () => {
        if (isLoadingStatus) {
            return (
                <button
                    disabled
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-[#8b5cf6]/50 to-[#c026d3]/50 text-white/70 font-bold text-lg"
                >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                </button>
            );
        }

        if (requestStatus === 'pending') {
            return (
                <div className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-lg">
                    <Clock className="w-5 h-5" />
                    Request Pending Review
                </div>
            );
        }

        if (requestStatus === 'approved') {
            return (
                <div className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-lg">
                    <CheckCircle className="w-5 h-5" />
                    Credits Approved!
                </div>
            );
        }

        return (
            <button
                onClick={handleRequestCredits}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all text-white font-bold text-lg shadow-lg hover:shadow-[#8b5cf6]/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                    </>
                ) : (
                    <>
                        <Gift className="w-5 h-5" />
                        Request {BETA_CREDITS_PER_REQUEST} Credits
                    </>
                )}
            </button>
        );
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
                <div className="p-6 space-y-5">

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
                        <p className="text-lg text-white font-medium leading-relaxed">
                            Request <span className="text-[#00d4ff] font-bold">{BETA_CREDITS_PER_REQUEST} free credits</span> for Beta
                        </p>
                    </div>

                    {/* Message Input - Only show if not already requested */}
                    {requestStatus === 'none' && !isLoadingStatus && (
                        <div className="space-y-2">
                            <label className="text-sm text-[#9ca3af]">
                                Message (optional)
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Tell us how you plan to use ImageLingo..."
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-[#6b7280] focus:outline-none focus:border-[#8b5cf6]/50 resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Contact Email Display with Copy */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <Mail className="w-4 h-4 text-[#8b5cf6] flex-shrink-0" />
                            <span className="text-white font-mono text-sm truncate">{SUPPORT_EMAIL}</span>
                        </div>
                        <button
                            onClick={handleCopyEmail}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-xs font-medium"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3 h-3 text-green-400" />
                                    <span className="text-green-400">Copied!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {/* Request Credits Button */}
                        {renderRequestButton()}

                        {/* Feedback Button - Opens FeedbackDialog */}
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
