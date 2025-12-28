'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft, MessageSquare, Gift, Mail, Eye, Archive } from 'lucide-react';
import { BETA_CREDITS_PER_REQUEST } from '@/lib/config';

/**
 * Admin Dashboard
 *
 * SECURITY & PRIVACY:
 * - This page is ONLY accessible to admin email (lihaoz0214@gmail.com)
 * - Protected by client-side auth check AND server-side API restrictions
 */

interface BetaRequest {
  id: string;
  user_id: string;
  email: string;
  message?: string;
  display_name: string;
  status: 'pending' | 'approved' | 'rejected';
  credits_granted: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

interface Feedback {
  id: string;
  user_id?: string;
  email?: string;
  message: string;
  source: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
  read_at?: string;
}

type TabType = 'beta' | 'feedback';

const ADMIN_EMAIL = 'lihaoz0214@gmail.com';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('beta');

  // Beta requests state
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [loadingBeta, setLoadingBeta] = useState(true);
  const [betaError, setBetaError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Refill state
  const [refillAmount, setRefillAmount] = useState<Record<string, number>>({});
  const [refillProcessingId, setRefillProcessingId] = useState<string | null>(null);

  // Feedback state
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // SECURITY: Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
      return;
    }

    if (isAdmin) {
      fetchRequests();
      fetchFeedback();
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchRequests = async () => {
    try {
      setLoadingBeta(true);
      setBetaError(null);

      const response = await fetch('/api/admin/beta-requests');

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setBetaError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoadingBeta(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoadingFeedback(true);
      setFeedbackError(null);

      const response = await fetch('/api/admin/feedback');

      if (!response.ok) {
        throw new Error('Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedbackList(data.feedback || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setFeedbackError(err instanceof Error ? err.message : 'Failed to load feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm(`Are you sure you want to approve this request and grant ${BETA_CREDITS_PER_REQUEST} beta credits?`)) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/admin/beta-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          creditsToGrant: BETA_CREDITS_PER_REQUEST,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      alert('Request approved successfully!');
      fetchRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefill = async (requestId: string) => {
    const amount = refillAmount[requestId] || 25; // Default to 25 if not set
    
    // Frontend validation
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) {
      alert('Please enter a valid token amount (1-10000)');
      return;
    }
    
    if (!confirm(`Are you sure you want to refill ${amount} tokens for this user?`)) {
      return;
    }

    setRefillProcessingId(requestId);
    try {
      const response = await fetch('/api/admin/beta-refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          creditsToRefill: amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refill tokens');
      }

      const data = await response.json();
      alert(`Successfully refilled ${data.creditsRefilled} tokens! Total granted: ${data.totalCreditsGranted}`);
      fetchRequests();
    } catch (err) {
      console.error('Error refilling tokens:', err);
      alert(err instanceof Error ? err.message : 'Failed to refill tokens');
    } finally {
      setRefillProcessingId(null);
    }
  };

  const handleMarkAsRead = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          status: 'read',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      fetchFeedback();
    } catch (err) {
      console.error('Error marking feedback as read:', err);
    }
  };

  const handleArchive = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackId,
          status: 'archived',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive');
      }

      fetchFeedback();
    } catch (err) {
      console.error('Error archiving feedback:', err);
    }
  };

  // Show nothing while checking auth
  if (authLoading || !isAdmin) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-sm">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-sm">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getFeedbackStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm">
            <Mail className="w-3 h-3" />
            Unread
          </span>
        );
      case 'read':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
            <Eye className="w-3 h-3" />
            Read
          </span>
        );
      case 'archived':
        return (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 text-sm">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const pendingBetaCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1f] via-[#1a1a3e] to-[#0a0a1f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-[#9ca3af] hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[#9ca3af]">
            Manage beta requests and user feedback
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('beta')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'beta'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                : 'bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gift className="w-4 h-4" />
            Beta Requests
            {pendingBetaCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold">
                {pendingBetaCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                : 'bg-white/5 text-[#9ca3af] hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Feedback
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Beta Requests Tab */}
        {activeTab === 'beta' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#9ca3af] text-sm mb-1">Total Requests</p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
              <div className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-300">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
                <p className="text-green-300 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-300">
                  {requests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>

            {/* Requests Table */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Beta Requests</h2>
                  <button
                    onClick={fetchRequests}
                    disabled={loadingBeta}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {loadingBeta ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {betaError && (
                <div className="p-6 bg-red-500/10 border-b border-red-500/30">
                  <p className="text-red-300">{betaError}</p>
                </div>
              )}

              {loadingBeta ? (
                <div className="p-12 text-center">
                  <p className="text-[#9ca3af]">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[#9ca3af]">No beta requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">User</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Message</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Requested</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {requests.map((request) => (
                        <tr key={request.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-white">{request.display_name}</p>
                            <p className="text-xs text-[#9ca3af]">{request.user_id.slice(0, 8)}...</p>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{request.email}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate" title={request.message || '-'}>
                            {request.message || '-'}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="px-6 py-4">
                            {request.status === 'pending' ? (
                              <button
                                onClick={() => handleApprove(request.id)}
                                disabled={processingId === request.id}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                {processingId === request.id ? 'Processing...' : 'Approve'}
                              </button>
                            ) : request.status === 'approved' ? (
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="number"
                                    value={refillAmount[request.id] || ''}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);
                                      if (!isNaN(value) && value >= 0) {
                                        setRefillAmount({ ...refillAmount, [request.id]: value });
                                      } else if (e.target.value === '') {
                                        setRefillAmount({ ...refillAmount, [request.id]: 0 });
                                      }
                                    }}
                                    placeholder="Amount"
                                    min="1"
                                    max="10000"
                                    className="px-3 py-2 w-32 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500"
                                    disabled={refillProcessingId === request.id}
                                  />
                                  <div className="flex gap-1">
                                    {[25, 50, 100, 200, 500].map((preset) => (
                                      <button
                                        key={preset}
                                        onClick={() => setRefillAmount({ ...refillAmount, [request.id]: preset })}
                                        className="px-2 py-0.5 text-xs rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                                        disabled={refillProcessingId === request.id}
                                      >
                                        {preset}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRefill(request.id)}
                                  disabled={refillProcessingId === request.id || !refillAmount[request.id] || refillAmount[request.id] < 1}
                                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                                >
                                  {refillProcessingId === request.id ? 'Refilling...' : 'Refill'}
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#9ca3af] text-sm">
                                {request.approved_at && `Approved ${formatDate(request.approved_at)}`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[#9ca3af] text-sm mb-1">Total Feedback</p>
                <p className="text-3xl font-bold">{feedbackList.length}</p>
              </div>
              <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-300 text-sm mb-1">Unread</p>
                <p className="text-3xl font-bold text-blue-300">{unreadCount}</p>
              </div>
              <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
                <p className="text-green-300 text-sm mb-1">Read</p>
                <p className="text-3xl font-bold text-green-300">
                  {feedbackList.filter(f => f.status === 'read').length}
                </p>
              </div>
            </div>

            {/* Feedback List */}
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">User Feedback</h2>
                  <button
                    onClick={fetchFeedback}
                    disabled={loadingFeedback}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {loadingFeedback ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {feedbackError && (
                <div className="p-6 bg-red-500/10 border-b border-red-500/30">
                  <p className="text-red-300">{feedbackError}</p>
                </div>
              )}

              {loadingFeedback ? (
                <div className="p-12 text-center">
                  <p className="text-[#9ca3af]">Loading feedback...</p>
                </div>
              ) : feedbackList.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-[#9ca3af]">No feedback found</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {feedbackList.filter(f => f.status !== 'archived').map((feedback) => (
                    <div
                      key={feedback.id}
                      className={`p-6 hover:bg-white/5 transition-colors ${
                        feedback.status === 'unread' ? 'bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getFeedbackStatusBadge(feedback.status)}
                            <span className="text-sm text-[#9ca3af]">
                              {formatDate(feedback.created_at)}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-[#9ca3af]">
                              {feedback.source}
                            </span>
                          </div>
                          <p className="text-sm text-[#00d4ff] mb-2">
                            {feedback.email || 'Anonymous'}
                          </p>
                          <p className="text-white whitespace-pre-wrap">{feedback.message}</p>
                        </div>
                        <div className="flex gap-2">
                          {feedback.status === 'unread' && (
                            <button
                              onClick={() => handleMarkAsRead(feedback.id)}
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                              title="Mark as read"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleArchive(feedback.id)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                            title="Archive"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
