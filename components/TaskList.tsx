'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabaseClient } from '@/lib/supabase';

interface Task {
    id: string;
    originalText: string;
    translatedText?: string;
    sourceLanguage: string;
    targetLanguage?: string;
    status: string;
    createdAt: string;
    imageUrl?: string;
}

export default function TaskList() {
    const { user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
    }, [user]);

    const fetchTasks = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const supabase = getSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }

            const data = await response.json();
            setTasks(data.tasks || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err instanceof Error ? err.message : 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;

        try {
            const supabase = getSupabaseClient();
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/tasks/${taskId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete task');
            }

            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Failed to delete task');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="glass p-8">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Recent Tasks</h2>
                <div className="flex justify-center py-12">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass p-8">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Recent Tasks</h2>
                <div className="text-center py-12 text-red-400">
                    <p>Error: {error}</p>
                    <button
                        onClick={fetchTasks}
                        className="mt-4 px-6 py-2 rounded-lg border border-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="glass p-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">Recent Tasks</h2>
                <button
                    onClick={fetchTasks}
                    className="px-4 py-2 rounded-lg border border-gray-700 hover:border-primary transition-colors text-sm"
                >
                    ↻ Refresh
                </button>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">📭</div>
                    <p>No tasks yet</p>
                    <p className="text-sm mt-2">Upload an image to get started</p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {tasks.map((task, index) => (
                        <div
                            key={task.id}
                            className="p-4 rounded-lg bg-black/30 border border-gray-700 hover:border-primary/50 transition-all fade-in-up"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' :
                                                task.status === 'processing' ? 'bg-yellow-500 pulse' :
                                                    task.status === 'failed' ? 'bg-red-500' :
                                                        'bg-gray-500'
                                            }`}
                                    ></span>
                                    <span className="text-xs text-gray-500">{formatDate(task.createdAt)}</span>
                                </div>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-2">
                                {/* Original Text */}
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-primary">Original</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                                            {task.sourceLanguage}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 line-clamp-2">
                                        {task.originalText || 'No text extracted'}
                                    </p>
                                </div>

                                {/* Translated Text */}
                                {task.translatedText && (
                                    <div className="pt-2 border-t border-gray-800">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-secondary">Translation</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary">
                                                {task.targetLanguage}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-300 line-clamp-2">
                                            {task.translatedText}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
