'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

/**
 * Admin Beta Requests Dashboard
 * 
 * SECURITY & PRIVACY:
 * - This page is ONLY accessible to admin email (lihaoz0214@gmail.com)
 * - Protected by client-side auth check AND server-side API restrictions
 * - This page should NOT be indexed or linked from public pages
 * - Never expose user lists or personal data to non-admin users
 * 
 * DEPLOYMENT NOTE:
 * - Add this route to robots.txt to prevent indexing
 * - Do not link to this page from any public-facing pages
 * - Access is strictly for admin via direct URL
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

const ADMIN_EMAIL = 'lihaoz0214@gmail.com';

export default function AdminBetaRequestsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // SECURITY: Check if user is admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    // SECURITY: Redirect non-admin users
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
      return;
    }

    if (isAdmin) {
      fetchRequests();
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/beta-requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this request and grant 100 beta tokens?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await fetch('/api/admin/beta-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          creditsToGrant: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve request');
      }

      alert('Request approved successfully!');
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error('Error approving request:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
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
            Beta Token Requests Dashboard
          </h1>
          <p className="text-[#9ca3af]">
            Admin Panel - Review and approve beta token requests
          </p>
        </div>

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
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-6 bg-red-500/10 border-b border-red-500/30">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
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
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#9ca3af]">Credits</th>
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
                      <td className="px-6 py-4 text-[#9ca3af]">{request.email}</td>
                      <td className="px-6 py-4 text-[#9ca3af] text-sm max-w-xs truncate" title={request.message || '-'}>
                        {request.message || '-'}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4 text-[#9ca3af] text-sm">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        {request.credits_granted > 0 ? (
                          <span className="text-green-300">{request.credits_granted}</span>
                        ) : (
                          <span className="text-[#9ca3af]">-</span>
                        )}
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
      </div>
    </div>
  );
}
