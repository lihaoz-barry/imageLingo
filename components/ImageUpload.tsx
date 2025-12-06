'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UploadProgress {
    stage: 'idle' | 'uploading' | 'extracting' | 'translating' | 'complete' | 'error';
    percent: number;
    message: string;
}

interface OCRResult {
    taskId: string;
    originalText: string;
    detectedLanguage: string;
    translatedText?: string;
    targetLanguage?: string;
    imageUrl?: string;
}

interface ImageUploadProps {
    onUploadComplete?: () => void;
}

export default function ImageUpload({ onUploadComplete }: ImageUploadProps) {
    const { user } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [progress, setProgress] = useState<UploadProgress>({
        stage: 'idle',
        percent: 0,
        message: ''
    });
    const [result, setResult] = useState<OCRResult | null>(null);
    const [targetLang, setTargetLang] = useState('English');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload and process
        await uploadImage(file);
    };

    const uploadImage = async (file: File) => {
        try {
            setProgress({ stage: 'uploading', percent: 10, message: 'Uploading image...' });
            setResult(null);

            // Get auth token
            const token = await user?.getIdToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('image', file);
            if (targetLang && targetLang !== 'None') {
                formData.append('targetLanguage', targetLang);
            }

            setProgress({ stage: 'extracting', percent: 30, message: 'Extracting text from image...' });

            // Upload to backend
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            if (targetLang && targetLang !== 'None') {
                setProgress({ stage: 'translating', percent: 70, message: `Translating to ${targetLang}...` });
            }

            const data: OCRResult = await response.json();

            setProgress({ stage: 'complete', percent: 100, message: 'Complete!' });
            setResult(data);

            if (onUploadComplete) {
                onUploadComplete();
            }

            // Reset after 2 seconds
            setTimeout(() => {
                setProgress({ stage: 'idle', percent: 0, message: '' });
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            setProgress({
                stage: 'error',
                percent: 0,
                message: error instanceof Error ? error.message : 'Upload failed'
            });
        }
    };

    const getProgressColor = () => {
        switch (progress.stage) {
            case 'error': return 'bg-red-500';
            case 'complete': return 'bg-green-500';
            default: return 'bg-gradient-to-r from-primary via-secondary to-accent';
        }
    };

    return (
        <div className="glass p-8">
            <h2 className="text-2xl font-bold mb-6 gradient-text">Upload Image</h2>

            {/* Language Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                    Target Language (optional)
                </label>
                <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="w-full p-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary outline-none transition-colors"
                    disabled={progress.stage !== 'idle'}
                >
                    <option value="None">None (Extract only)</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Chinese">Chinese (Simplified)</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Korean">Korean</option>
                    <option value="Portuguese">Portuguese</option>
                    <option value="Russian">Russian</option>
                    <option value="Arabic">Arabic</option>
                </select>
            </div>

            {/* Upload Area */}
            <div
                className={`upload-area ${isDragging ? 'drag-over' : ''} mb-6`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={progress.stage !== 'idle'}
                />

                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Preview"
                            className="max-h-64 mx-auto rounded-lg"
                        />
                        {progress.stage === 'idle' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPreview(null);
                                    setResult(null);
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        <div className="text-6xl mb-4">📸</div>
                        <p className="text-xl font-semibold mb-2">Drop your image here</p>
                        <p className="text-gray-400">or click to browse</p>
                        <p className="text-sm text-gray-500 mt-4">Supports: JPG, PNG, GIF, WebP</p>
                    </div>
                )}
            </div>

            {/* Progress */}
            {progress.stage !== 'idle' && (
                <div className="mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{progress.message}</span>
                        <span className="text-sm font-medium">{progress.percent}%</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className={`progress-bar-fill ${getProgressColor()}`}
                            style={{ width: `${progress.percent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Original Text */}
                    <div className="p-4 rounded-lg bg-black/30 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-primary">Extracted Text</h3>
                            <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                                {result.detectedLanguage}
                            </span>
                        </div>
                        <p className="text-gray-300 whitespace-pre-wrap">{result.originalText || 'No text detected'}</p>
                    </div>

                    {/* Translated Text */}
                    {result.translatedText && (
                        <div className="p-4 rounded-lg bg-black/30 border border-secondary">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-secondary">Translated Text</h3>
                                <span className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary">
                                    {result.targetLanguage}
                                </span>
                            </div>
                            <p className="text-gray-300 whitespace-pre-wrap">{result.translatedText}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
