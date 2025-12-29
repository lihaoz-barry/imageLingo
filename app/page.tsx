'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { AuthDialog } from '@/components/AuthDialog';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UploadZoneWithShowcase } from '@/components/UploadZoneWithShowcase';
import { ImageThumbnails, type ImageFile } from '@/components/ImageThumbnails';
import { ProcessButton } from '@/components/ProcessButton';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { VariationSelector } from '@/components/VariationSelector';
import { CostCalculator } from '@/components/CostCalculator';
import { ResultsGridWithVariations, type ProcessedImageWithVariations } from '@/components/ResultsGridWithVariations';
import { HistoryPanel, type HistoryItem } from '@/components/HistoryPanel';
import { BillingPanel } from '@/components/BillingPanel';
import { BetaFeedbackPanel } from '@/components/BetaFeedbackPanel';
import { Footer } from '@/components/Footer';
import { IS_BETA } from '@/lib/config';

// Default project name for translations
const DEFAULT_PROJECT_NAME = 'Translations';

import { LANGUAGE_NAMES, getLanguageCode } from '@/lib/languages';

const COST_PER_IMAGE = 1; // 1 token per image variation

// Demo mode check
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

import { ShowcaseModal } from '@/components/ShowcaseModal';
import { useGenerationRealtime, fetchGenerationResult } from '@/hooks/useGenerationRealtime';
import { ProcessingQueue, type ProcessingJob } from '@/components/ProcessingQueue';

export default function Home() {
  const { user, tokenBalance, setTokenBalance } = useAuth();

  // State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [variationsPerImage, setVariationsPerImage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ProcessedImageWithVariations[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  // Real API integration state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [hasUserAdjustedPreferences, setHasUserAdjustedPreferences] = useState(false);

  // Async processing state
  const [pendingGenerationIds, setPendingGenerationIds] = useState<string[]>([]);
  const [totalOperations, setTotalOperations] = useState(0);
  const [completedOperations, setCompletedOperations] = useState(0);
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);

  // Map to track generation metadata: generationId -> { imageFileId, variationIndex, uploadedImageUrl, processingMs }
  const generationMetaRef = useRef<Map<string, {
    imageFileId: string;
    imageFileName: string;
    variationIndex: number;
    uploadedImageUrl: string;
    processingMs?: number;
  }>>(new Map());

  // Fetch history and preferences when user logs in
  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, set mock values
      setPreferencesLoaded(true);
      return;
    }
    if (user) {
      fetchPlan();
      fetchHistory();
      fetchPreferences();
    } else {
      setHistory([]);
      setPreferencesLoaded(false);
      setHasUserAdjustedPreferences(false);
    }
  }, [user]);

  // Save preferences when they change (only after initial load)
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await fetch('/api/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_language: sourceLanguage,
            target_language: targetLanguage,
            variations_per_image: variationsPerImage,
          }),
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    };

    if (user && (preferencesLoaded || hasUserAdjustedPreferences)) {
      savePreferences();
    }
  }, [user, preferencesLoaded, hasUserAdjustedPreferences, sourceLanguage, targetLanguage, variationsPerImage]);

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/preferences');
      if (res.ok) {
        const data = await res.json();
        setSourceLanguage(data.source_language || 'auto');
        setTargetLanguage(data.target_language || 'en');
        setVariationsPerImage(data.variations_per_image || 1);
        setPreferencesLoaded(true);
        setHasUserAdjustedPreferences(false);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const fetchPlan = async () => {
    try {
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        if (data.subscription?.plan) {
          setCurrentPlan(data.subscription.plan as 'free' | 'pro' | 'enterprise');
        }
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        // Convert API response to HistoryItem format
        const historyItems: HistoryItem[] = (data.history || []).map((item: {
          id: string;
          source_language: string;
          target_language: string;
          tokens_used: number;
          processing_ms: number;
          created_at: string;
          input_image: { id: string; original_filename: string; url: string };
          output_image: { id: string; original_filename: string; url: string };
        }) => ({
          id: item.id,
          date: new Date(item.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          images: [{
            id: item.id,
            originalName: item.input_image?.original_filename || 'image',
            sourceLanguage: LANGUAGE_NAMES[item.source_language] || item.source_language || 'Auto',
            targetLanguage: LANGUAGE_NAMES[item.target_language] || item.target_language || 'Unknown',
            originalUrl: item.input_image?.url || '',
            processedUrl: item.output_image?.url || '',
            processingMs: item.processing_ms,
          }],
          sourceLanguage: LANGUAGE_NAMES[item.source_language] || item.source_language || 'Auto',
          targetLanguage: LANGUAGE_NAMES[item.target_language] || item.target_language || 'Unknown',
          tokensUsed: item.tokens_used || 1,
          processingMs: item.processing_ms,
        }));
        setHistory(historyItems);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  // Get or create default project
  const ensureProject = useCallback(async (): Promise<string | null> => {
    if (projectId) return projectId;

    try {
      // First, try to fetch existing projects
      const listRes = await fetch('/api/projects');
      if (!listRes.ok) {
        console.error('Failed to fetch projects');
        return null;
      }

      const { projects } = await listRes.json();
      const defaultProject = projects?.find(
        (p: { name: string }) => p.name === DEFAULT_PROJECT_NAME
      );

      if (defaultProject) {
        setProjectId(defaultProject.id);
        return defaultProject.id;
      }

      // Create new project if none exists
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: DEFAULT_PROJECT_NAME }),
      });

      if (!createRes.ok) {
        console.error('Failed to create project');
        return null;
      }

      const { project } = await createRes.json();
      setProjectId(project.id);
      return project.id;
    } catch (error) {
      console.error('Project error:', error);
      return null;
    }
  }, [projectId]);

  // Handle generation completion from realtime subscription
  const handleGenerationComplete = useCallback(async (generation: { id: string; processing_ms: number | null }) => {
    const meta = generationMetaRef.current.get(generation.id);
    if (!meta) {
      console.warn('No metadata found for generation:', generation.id);
      return;
    }

    // Store processing time in metadata
    if (generation.processing_ms !== null && generation.processing_ms !== undefined) {
      meta.processingMs = generation.processing_ms;
    }

    // Fetch the signed URL for the completed generation
    const result = await fetchGenerationResult(generation.id);
    if (!result || !result.outputUrl) {
      console.error('Failed to fetch output URL for generation:', generation.id);
      return;
    }

    // Remove from pending
    setPendingGenerationIds(prev => prev.filter(id => id !== generation.id));

    // Increment completed count
    setCompletedOperations(prev => {
      const newCount = prev + 1;
      setProgress(Math.round((newCount / totalOperations) * 100));
      return newCount;
    });

    // Update processing jobs state
    setProcessingJobs(prev => prev.map(job =>
      job.id === meta.imageFileId
        ? {
          ...job,
          status: 'done' as const,
          progress: 100,
          currentVariation: job.totalVariations // Assuming simple variation mapping for now
        }
        : job
    ));

    // Update results - group variations by image
    setResults(prevResults => {
      const existingResult = prevResults.find(r => r.id === meta.imageFileId);

      if (existingResult) {
        // Add new variation to existing image result
        return prevResults.map(r => {
          if (r.id === meta.imageFileId) {
            return {
              ...r,
              variations: [
                ...r.variations,
                {
                  id: `${meta.imageFileId}-var-${meta.variationIndex}`,
                  url: result.outputUrl!,
                  variationNumber: meta.variationIndex + 1,
                  processingMs: meta.processingMs,
                },
              ].sort((a, b) => a.variationNumber - b.variationNumber),
            };
          }
          return r;
        });
      } else {
        // Create new result for this image
        const newResult: ProcessedImageWithVariations = {
          id: meta.imageFileId,
          originalName: meta.imageFileName,
          sourceLanguage: LANGUAGE_NAMES[sourceLanguage] || 'Auto',
          targetLanguage: LANGUAGE_NAMES[targetLanguage] || 'Spanish',
          targetLanguageCode: targetLanguage,
          originalUrl: meta.uploadedImageUrl,
          variations: [{
            id: `${meta.imageFileId}-var-${meta.variationIndex}`,
            url: result.outputUrl!,
            variationNumber: meta.variationIndex + 1,
            processingMs: meta.processingMs,
          }],
          selectedVariationId: `${meta.imageFileId}-var-${meta.variationIndex}`,
        };
        return [...prevResults, newResult];
      }
    });
  }, [sourceLanguage, targetLanguage, totalOperations]);

  // Handle generation failure from realtime subscription
  const handleGenerationFailed = useCallback((generation: { id: string; error_message: string | null }) => {
    console.error('Generation failed:', generation.id, generation.error_message);

    // Update processing job status
    const meta = generationMetaRef.current.get(generation.id);
    if (meta) {
      setProcessingJobs(prev => prev.map(job =>
        job.id === meta.imageFileId
          ? { ...job, status: 'error' as const, errorMessage: generation.error_message || 'Processing failed' }
          : job
      ));
    }

    setPendingGenerationIds(prev => prev.filter(id => id !== generation.id));
    setCompletedOperations(prev => {
      const newCount = prev + 1;
      setProgress(Math.round((newCount / totalOperations) * 100));
      return newCount;
    });
  }, [totalOperations]);

  // Subscribe to realtime updates for pending generations
  useGenerationRealtime({
    userId: user?.id || null,
    generationIds: pendingGenerationIds,
    onComplete: handleGenerationComplete,
    onFailed: handleGenerationFailed,
  });

  // Check if all operations are complete
  useEffect(() => {
    if (isProcessing && pendingGenerationIds.length === 0 && completedOperations > 0 && completedOperations >= totalOperations) {
      setIsProcessing(false);
      setProgressStatus('All translations complete!');
      fetchHistory();
    }
  }, [isProcessing, pendingGenerationIds.length, completedOperations, totalOperations]);

  const handleSourceLanguageChange = (value: string) => {
    setSourceLanguage(value);
    setHasUserAdjustedPreferences(true);
  };

  const handleTargetLanguageChange = (value: string) => {
    setTargetLanguage(value);
    setHasUserAdjustedPreferences(true);
  };

  const handleVariationsChange = (value: number) => {
    setVariationsPerImage(value);
    setHasUserAdjustedPreferences(true);
  };

  const handleFilesSelected = (files: File[]) => {
    const newImages: ImageFile[] = files.slice(0, 10).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const image = prev.find((img) => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleProcess = async () => {
    // Check if user is logged in (in demo mode, user is always "logged in")
    if (!user && !isDemoMode) {
      setIsAuthOpen(true);
      return;
    }

    const totalCost = images.length * variationsPerImage * COST_PER_IMAGE;

    if (tokenBalance < totalCost && !isDemoMode) {
      alert(`Insufficient tokens! You need ${totalCost} tokens but only have ${tokenBalance}. Click on your token balance to add more.`);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setProgressStatus('Initializing...');

    // Demo mode: simulate processing without API calls
    if (isDemoMode) {
      const imageFile = images[0];
      if (!imageFile) {
        setIsProcessing(false);
        return;
      }

      // Simulate progress with delays
      const simulateProgress = async () => {
        const steps = [
          { progress: 10, status: 'Uploading image...', delay: 300 },
          { progress: 25, status: 'Analyzing image content...', delay: 500 },
          { progress: 45, status: 'Detecting text regions...', delay: 600 },
          { progress: 65, status: 'Translating text...', delay: 700 },
          { progress: 85, status: 'Generating localized image...', delay: 500 },
          { progress: 100, status: 'Translation complete!', delay: 300 },
        ];

        for (const step of steps) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
          setProgress(step.progress);
          setProgressStatus(step.status);
        }
      };

      await simulateProgress();

      // Create mock result using showcase images
      const mockResult: ProcessedImageWithVariations = {
        id: imageFile.id,
        originalName: imageFile.name,
        sourceLanguage: LANGUAGE_NAMES[sourceLanguage] || 'Chinese',
        targetLanguage: LANGUAGE_NAMES[targetLanguage] || 'English',
        targetLanguageCode: targetLanguage,
        originalUrl: imageFile.preview,
        variations: [
          {
            id: `${imageFile.id}-var-0`,
            url: '/images/showcase/product-en.jpg', // Use existing showcase image
            variationNumber: 1,
          },
        ],
        selectedVariationId: `${imageFile.id}-var-0`,
      };

      setResults([mockResult]);
      setTokenBalance(prev => Math.max(0, prev - totalCost));
      setIsProcessing(false);
      return;
    }

    try {
      // Ensure we have a project
      const projId = await ensureProject();
      if (!projId) {
        throw new Error('Failed to create or fetch project');
      }

      if (images.length === 0) {
        throw new Error('No images selected');
      }

      // Reset async processing state
      const totalOps = images.length * variationsPerImage;
      setTotalOperations(totalOps);
      setCompletedOperations(0);
      generationMetaRef.current.clear();

      // Initialize processing jobs state
      const initialJobs: ProcessingJob[] = images.map(img => ({
        id: img.id,
        imageFile: img,
        status: 'uploading' as const,
        currentVariation: 0,
        totalVariations: variationsPerImage,
        progress: 5,
      }));
      setProcessingJobs(initialJobs);

      setProgressStatus('Uploading images...');

      // Step 1: Upload all images in parallel
      const uploadPromises = images.map(async (imageFile) => {
        const formData = new FormData();
        formData.append('file', imageFile.file);
        formData.append('project_id', projId);

        const uploadRes = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || `Failed to upload image ${imageFile.name}`);
        }

        const { image: uploadedImage } = await uploadRes.json();

        // Get signed URL for the uploaded image
        const urlRes = await fetch(`/api/images/${uploadedImage.id}`);
        const urlData = urlRes.ok ? await urlRes.json() : null;

        return {
          imageFile,
          uploadedImage,
          uploadedImageUrl: urlData?.url || imageFile.preview,
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // Update jobs to reflect upload completion
      setProcessingJobs(prev => prev.map(job =>
        ({ ...job, status: 'processing' as const, progress: 15 })
      ));

      setProgressStatus('Creating translation tasks...');

      // Step 2: Create all generations in parallel
      const generationPromises: Promise<{ generationId: string; imageFileId: string; imageFileName: string; variationIndex: number; uploadedImageUrl: string }>[] = [];

      for (const { imageFile, uploadedImage, uploadedImageUrl } of uploadedImages) {
        for (let varIndex = 0; varIndex < variationsPerImage; varIndex++) {
          const promise = (async () => {
            const genRes = await fetch('/api/generations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projId,
                type: 'translation',
                input_image_id: uploadedImage.id,
                source_language: sourceLanguage,
                target_language: targetLanguage,
              }),
            });

            if (!genRes.ok) {
              const error = await genRes.json();
              throw new Error(error.error || `Failed to create generation`);
            }

            const { generation: newGeneration } = await genRes.json();
            return {
              generationId: newGeneration.id,
              imageFileId: imageFile.id,
              imageFileName: imageFile.name,
              variationIndex: varIndex,
              uploadedImageUrl,
            };
          })();

          generationPromises.push(promise);
        }
      }

      const generations = await Promise.all(generationPromises);

      // Store metadata for each generation
      for (const gen of generations) {
        generationMetaRef.current.set(gen.generationId, {
          imageFileId: gen.imageFileId,
          imageFileName: gen.imageFileName,
          variationIndex: gen.variationIndex,
          uploadedImageUrl: gen.uploadedImageUrl,
        });
      }

      // Track pending generation IDs for realtime subscription
      const generationIds = generations.map(g => g.generationId);
      setPendingGenerationIds(generationIds);

      setProgressStatus(`Processing ${totalOps} translations...`);

      // Step 3: Fire all translate requests in parallel (fire-and-forget)
      // The backend processes them and updates the generations table
      // Our realtime subscription will catch the completion events
      const translatePromises = generations.map(async ({ generationId }) => {
        try {
          const translateRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              generation_id: generationId,
            }),
          });

          // Even if this fails, the realtime subscription will
          // catch the 'failed' status update
          if (!translateRes.ok) {
            console.error('Translate request failed for:', generationId);
          }
        } catch (error) {
          console.error('Translate request error:', error);
        }
      });

      // Don't await - let them run in parallel
      // The isProcessing state will be set to false when all complete via the useEffect
      Promise.all(translatePromises).catch(console.error);

      // --- INITIAL SYNC ---
      // After firing requests, check status once immediately to catch rapid completions
      // that might have finished before WebSocket was fully subscribed.
      setTimeout(async () => {
        console.log('[Initial Sync] Performing one-time status check...');
        const syncPromises = generationIds.map(async (id) => {
          try {
            const res = await fetch(`/api/generations/${id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.generation.status === 'completed') {
                console.log('[Initial Sync] Detected completion:', id);
                handleGenerationComplete(data.generation);
              } else if (data.generation.status === 'failed') {
                handleGenerationFailed(data.generation);
              }
            }
          } catch (err) {
            console.error('[Initial Sync] Error checking status for', id, err);
          }
        });
        await Promise.all(syncPromises);
      }, 500); // 500ms delay to allow server to at least start processing

      // Note: We don't set isProcessing to false here
      // The useEffect hook watching pendingGenerationIds will handle that
    } catch (error) {
      console.error('Translation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setProgressStatus(`Error: ${message}`);
      alert(`Translation failed: ${message}`);
      setIsProcessing(false);
    }
  };

  const handleSelectVariation = (imageId: string, variationId: string) => {
    setResults(prev => prev.map(result =>
      result.id === imageId
        ? { ...result, selectedVariationId: variationId }
        : result
    ));
  };

  const handleDownload = async (imageId: string, variationId: string) => {
    const result = results.find((r) => r.id === imageId);
    if (result) {
      const variation = result.variations.find(v => v.id === variationId);
      if (variation) {
        try {
          // Fetch as blob to bypass cross-origin download restrictions
          const response = await fetch(variation.url);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          // Build filename: {originalName}_{languageCode}.{ext}
          // Extract original filename without extension
          const originalNameWithoutExt = result.originalName.replace(/\.[^/.]+$/, '');
          // Get language code (fallback to 'en' if not available)
          const langCode = result.targetLanguageCode || 'en';
          // Get extension from blob type (e.g., 'image/png' -> 'png')
          const ext = blob.type.split('/')[1] || 'png';
          const fileName = `${originalNameWithoutExt}_${langCode}.${ext}`;

          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          URL.revokeObjectURL(blobUrl);
        } catch (error) {
          console.error('Download failed:', error);
          // Fallback: open in new tab
          window.open(variation.url, '_blank');
        }
      }
    }
  };

  const handleLogin = () => {
    setIsAuthOpen(true);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    // Convert history item back to results format with variations
    const resultsFromHistory: ProcessedImageWithVariations[] = item.images.map((img) => ({
      id: img.id,
      originalName: img.originalName,
      sourceLanguage: img.sourceLanguage,
      targetLanguage: img.targetLanguage,
      targetLanguageCode: img.targetLanguageCode || getLanguageCode(img.targetLanguage),
      originalUrl: img.originalUrl,
      variations: [
        {
          id: `${img.id}-var-0`,
          url: img.processedUrl,
          variationNumber: 1,
          processingMs: img.processingMs,
        }
      ],
      selectedVariationId: `${img.id}-var-0`,
    }));

    setResults(resultsFromHistory);
    setIsHistoryOpen(false);

    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handlePurchaseTokens = (amount: number, cost: number) => {
    // In a real app, this would process payment
    setTokenBalance(prev => prev + amount);
    alert(`Successfully purchased ${amount} tokens for $${cost.toFixed(2)}!`);
    setIsBillingOpen(false);
  };

  const handleUpgradePlan = (plan: 'free' | 'pro' | 'enterprise') => {
    if (plan === currentPlan) return;

    const planTokens = {
      free: 50,
      pro: 500,
      enterprise: 2500,
    };

    setCurrentPlan(plan);
    setTokenBalance(prev => prev + planTokens[plan]);
    alert(`Successfully upgraded to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan! You received ${planTokens[plan]} tokens.`);
  };

  return (
    <div className="min-h-screen circuit-pattern">
      <Header
        isLoggedIn={!!user}
        userAvatar={user?.user_metadata?.avatar_url || undefined}
        userEmail={user?.email}
        onLogin={handleLogin}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onBillingClick={() => setIsBillingOpen(true)}
        tokenBalance={tokenBalance}
      />

      <AuthDialog open={isAuthOpen} onOpenChange={setIsAuthOpen} />

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onLoadHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
      />

      {/* Conditionally show Beta Feedback Panel or Billing Panel based on IS_BETA flag */}
      {IS_BETA ? (
        <BetaFeedbackPanel
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          currentTokens={tokenBalance}
          userEmail={user?.email}
        />
      ) : (
        <BillingPanel
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          currentTokens={tokenBalance}
          onPurchaseTokens={handlePurchaseTokens}
          currentPlan={currentPlan}
          onUpgradePlan={handleUpgradePlan}
        />
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {/* Main Upload Card */}
        <div
          className="rounded-2xl sm:rounded-[32px] backdrop-blur-md bg-white/5 border border-white/10 p-4 sm:p-8 md:p-12 mb-8"
          style={{
            boxShadow: '0 0 60px rgba(0, 212, 255, 0.15), 0 0 100px rgba(139, 92, 246, 0.1)',
          }}
        >
          <LanguageSelector
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSourceChange={handleSourceLanguageChange}
            onTargetChange={handleTargetLanguageChange}
          />

          {/* Variation Selector */}
          <div className="flex justify-center mb-6">
            <VariationSelector
              value={variationsPerImage}
              onChange={handleVariationsChange}
            />
          </div>

          <UploadZoneWithShowcase
            onFilesSelected={handleFilesSelected}
            hasImages={images.length > 0}
            isShowcaseOpen={isShowcaseOpen}
            setIsShowcaseOpen={setIsShowcaseOpen}
          />

          <ImageThumbnails images={images} onRemove={handleRemoveImage} />

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <ProcessButton
                onClick={handleProcess}
                disabled={images.length === 0 || isProcessing}
                isProcessing={isProcessing}
              />

              {images.length > 0 && !isProcessing && (
                <CostCalculator
                  imageCount={images.length}
                  variationsPerImage={variationsPerImage}
                  costPerImage={COST_PER_IMAGE}
                />
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="mt-8 space-y-6">
              <ProcessingQueue jobs={processingJobs} isVisible={true} />
              <ProgressIndicator progress={progress} status={progressStatus} />
            </div>
          )}
        </div>

        {/* Results Section */}
        <ResultsGridWithVariations
          results={results}
          onDownload={handleDownload}
          onSelectVariation={handleSelectVariation}
        />
      </main>

      <Footer />

      <ShowcaseModal
        isOpen={isShowcaseOpen}
        onClose={() => setIsShowcaseOpen(false)}
      />
    </div>
  );
}
