'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface LocalizedResult {
  originalFilename: string;
  localizedImageUrl: string;
  detectedLanguage: string;
  targetLanguage: string;
  status: string;
}

export default function Home() {
  const { user, signInWithGoogle, signOut } = useAuth();
  const [images, setImages] = useState<ImageFile[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState('Auto-Detect');
  const [targetLanguage, setTargetLanguage] = useState('Spanish (ES)');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [results, setResults] = useState<LocalizedResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    addImages(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addImages(Array.from(e.target.files));
  };

  const addImages = (files: File[]) => {
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleProcess = async () => {
    if (images.length === 0) return;
    setProcessing(true);
    setProgress(10);
    setProgressMessage('Uploading images...');
    setResults([]);

    try {
      const formData = new FormData();
      images.forEach(img => formData.append('images', img.file));
      const targetLang = targetLanguage.split(' (')[0];
      formData.append('targetLanguage', targetLang);

      setProgress(30);
      setProgressMessage('Analyzing with AI...');

      const response = await fetch('http://localhost:3001/api/localize/public', {
        method: 'POST',
        body: formData
      });

      setProgress(60);
      setProgressMessage('Generating localized images...');

      if (!response.ok) throw new Error('Processing failed');

      const data = await response.json();
      setProgress(100);
      setProgressMessage('Complete!');
      setResults(data.results || []);

      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process images. Please ensure the backend is running.');
      setProgress(0);
      setProgressMessage('');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0d0d2b 0%, #1a1a4a 50%, #2d1b69 100%)'
    }}>
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* Login Button */}
      <div className="absolute top-6 right-6 z-50">
        {user ? (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
            {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />}
            <span className="text-sm text-gray-300">{user.displayName || user.email}</span>
            <button onClick={signOut} className="text-xs px-3 py-1 rounded border border-gray-600 hover:border-cyan-400">Sign Out</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2 border border-white/20 hover:border-cyan-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            <span className="text-sm">Login</span>
          </button>
        )}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-6xl font-bold mb-2" style={{
            background: 'linear-gradient(90deg, #00d4ff 0%, #7c3aed 50%, #c026d3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontStyle: 'italic',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            ImageLingo
          </h1>
          <p className="text-gray-400 text-lg">AI-Powered Image Localization</p>
        </div>

        {/* Main Card with Glowing Border */}
        <div className="relative mb-6">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 blur-lg"></div>

          <div className="relative rounded-3xl p-8" style={{
            background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(40, 40, 80, 0.9) 100%)',
            border: '1px solid rgba(100, 150, 255, 0.3)'
          }}>
            {/* Language Selectors - Centered Pill */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full" style={{
                background: 'rgba(30, 30, 50, 0.8)',
                border: '1px solid rgba(100, 150, 255, 0.2)'
              }}>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Source:</span>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="bg-transparent text-cyan-400 font-medium outline-none cursor-pointer"
                    disabled={processing}
                  >
                    <option value="Auto-Detect" className="bg-gray-900">Auto-Detect</option>
                    <option value="English" className="bg-gray-900">English</option>
                    <option value="Spanish" className="bg-gray-900">Spanish</option>
                    <option value="Chinese" className="bg-gray-900">Chinese</option>
                    <option value="Japanese" className="bg-gray-900">Japanese</option>
                    <option value="Korean" className="bg-gray-900">Korean</option>
                  </select>
                </div>
                <div className="w-px h-6 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Target:</span>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="bg-transparent text-cyan-400 font-medium outline-none cursor-pointer"
                    disabled={processing}
                  >
                    <option value="English (EN)" className="bg-gray-900">English (EN)</option>
                    <option value="Spanish (ES)" className="bg-gray-900">Spanish (ES)</option>
                    <option value="French (FR)" className="bg-gray-900">French (FR)</option>
                    <option value="German (DE)" className="bg-gray-900">German (DE)</option>
                    <option value="Chinese (ZH)" className="bg-gray-900">Chinese (ZH)</option>
                    <option value="Japanese (JA)" className="bg-gray-900">Japanese (JA)</option>
                    <option value="Korean (KO)" className="bg-gray-900">Korean (KO)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Upload Area with Dashed Border */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => document.getElementById('fileInput')?.click()}
              className={`relative rounded-2xl py-16 px-8 text-center cursor-pointer transition-all duration-300 ${isDragging ? 'bg-cyan-500/10' : ''
                }`}
              style={{
                border: '3px dashed',
                borderColor: isDragging ? '#00d4ff' : '#9333ea',
                borderRadius: '20px'
              }}
            >
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Camera Icon */}
              <div className="flex justify-center mb-4">
                <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="20" width="60" height="45" rx="8" stroke="#6366f1" strokeWidth="2.5" fill="none" />
                  <circle cx="40" cy="42" r="12" stroke="#6366f1" strokeWidth="2.5" fill="none" />
                  <path d="M25 20L30 12H50L55 20" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="40" cy="42" r="5" fill="#6366f1" opacity="0.3" />
                  <path d="M58 8L58 16M62 12L54 12" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              <p className="text-xl font-semibold text-white mb-1">
                {isDragging ? 'Drop images here' : 'Drag & drop images'}
              </p>
              <p className="text-gray-400">or click to browse</p>
            </div>
          </div>
        </div>

        {/* Image Thumbnails - Separate Card */}
        {images.length > 0 && (
          <div className="relative mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-lg"></div>
            <div className="relative rounded-2xl p-4" style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(40, 40, 80, 0.9) 100%)',
              border: '1px solid rgba(100, 150, 255, 0.2)'
            }}>
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {images.map((img) => (
                  <div key={img.id} className="flex-shrink-0">
                    <div className="relative w-28 h-28 rounded-xl overflow-hidden group" style={{
                      background: 'rgba(50, 50, 80, 0.5)',
                      border: '2px solid rgba(100, 150, 255, 0.2)'
                    }}>
                      <img src={img.preview} alt={img.file.name} className="w-full h-full object-cover" />

                      {/* Checkmark */}
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      {/* Remove on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="text-white text-2xl">✕</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5 text-center truncate w-28">{img.file.name}</p>
                    <p className="text-xs text-gray-500 text-center">{(img.file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Process Button */}
        {images.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleProcess}
              disabled={processing}
              className="px-16 py-4 rounded-full text-white text-lg font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #c026d3 100%)',
                boxShadow: '0 10px 40px rgba(99, 102, 241, 0.5), 0 0 60px rgba(139, 92, 246, 0.3)'
              }}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {progressMessage}
                </span>
              ) : 'Process Images'}
            </button>

            {processing && (
              <div className="mt-6 max-w-md mx-auto">
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-gray-400">{progressMessage}</span>
                  <span className="text-cyan-400 font-semibold">{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #c026d3)'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-12">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-lg"></div>
              <div className="relative rounded-3xl p-8" style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.9) 0%, rgba(40, 40, 80, 0.9) 100%)',
                border: '1px solid rgba(100, 150, 255, 0.2)'
              }}>
                <h2 className="text-2xl font-bold mb-6" style={{
                  background: 'linear-gradient(90deg, #00d4ff, #c026d3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>Localized Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.map((result, index) => (
                    <div key={index} className="rounded-xl p-4" style={{ background: 'rgba(50, 50, 80, 0.5)', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                      <p className="text-sm text-gray-400 mb-2">{result.originalFilename}</p>
                      {result.status === 'completed' && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 mb-3">
                          {result.detectedLanguage} → {result.targetLanguage}
                        </span>
                      )}
                      {result.status === 'completed' && result.localizedImageUrl && (
                        <>
                          <img src={result.localizedImageUrl} alt="" className="w-full rounded-lg border border-cyan-500/30 mb-3" />
                          <a
                            href={result.localizedImageUrl}
                            download={`localized_${result.originalFilename}`}
                            className="block w-full py-2 rounded-lg text-center text-white font-medium"
                            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                          >
                            Download
                          </a>
                        </>
                      )}
                      {result.status === 'failed' && <p className="text-red-400 text-center py-4">Processing failed</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
