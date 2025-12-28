'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { ProcessingQueue, type ProcessingJob } from '@/components/ProcessingQueue';
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
  const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  // Real API integration state
  const [projectId, setProjectId] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [hasUserAdjustedPreferences, setHasUserAdjustedPreferences] = useState(false);

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
          }],
          sourceLanguage: LANGUAGE_NAMES[item.source_language] || item.source_language || 'Auto',
          targetLanguage: LANGUAGE_NAMES[item.target_language] || item.target_language || 'Unknown',
          tokensUsed: item.tokens_used || 1,
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

    // Ensure we have a project first
    const projId = await ensureProject();
    if (!projId) {
      alert('Failed to create or fetch project');
      setIsProcessing(false);
      return;
    }

    if (images.length === 0) {
      alert('No images selected');
      setIsProcessing(false);
      return;
    }

    // Create initial jobs for all images
    const initialJobs: ProcessingJob[] = images.map(img => ({
      id: img.id,
      imageFile: img,
      status: 'queued' as const,
      currentVariation: 0,
      totalVariations: variationsPerImage,
      progress: 0,
    }));

    setProcessingJobs(initialJobs);
    setProgressStatus(`Processing ${images.length} images...`);

    // Helper to update a specific job's status
    const updateJob = (jobId: string, updates: Partial<ProcessingJob>) => {
      setProcessingJobs(prev => prev.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      ));
    };

    // Process a single image job independently
    const processImageJob = async (job: ProcessingJob) => {
      try {
        updateJob(job.id, { status: 'uploading', progress: 5 });

        // Step 1: Upload image
        const formData = new FormData();
        formData.append('file', job.imageFile.file);
        formData.append('project_id', projId);

        const uploadRes = await fetch('/api/images', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const { image: uploadedImage } = await uploadRes.json();
        updateJob(job.id, { status: 'processing', progress: 15 });

        // Generate variations for this image
        const variations: { id: string; url: string; variationNumber: number }[] = [];

        for (let varIndex = 0; varIndex < variationsPerImage; varIndex++) {
          const variationNumber = varIndex + 1;
          updateJob(job.id, {
            currentVariation: variationNumber,
            progress: 15 + Math.round((varIndex / variationsPerImage) * 80),
          });

          // Step 2: Create generation for this variation
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

          // Step 3: Start translation (deducts 1 token per call)
          const translateRes = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              generation_id: newGeneration.id,
            }),
          });

          if (!translateRes.ok) {
            const error = await translateRes.json();
            throw new Error(error.error || `Translation failed`);
          }

          const translateData = await translateRes.json();

          // Add this variation to the list
          variations.push({
            id: `${job.imageFile.id}-var-${varIndex}`,
            url: translateData.output_url || '',
            variationNumber: variationNumber,
          });

          // Update credits from server response
          if (typeof translateData.credits_balance === 'number') {
            setTokenBalance(translateData.credits_balance);
          }

          // Update progress after each variation
          updateJob(job.id, {
            progress: 15 + Math.round(((varIndex + 1) / variationsPerImage) * 80),
          });
        }

        // Create result with all variations for this image
        const newResult: ProcessedImageWithVariations = {
          id: job.imageFile.id,
          originalName: job.imageFile.name,
          sourceLanguage: LANGUAGE_NAMES[sourceLanguage] || 'Auto',
          targetLanguage: LANGUAGE_NAMES[targetLanguage] || 'Spanish',
          targetLanguageCode: targetLanguage,
          originalUrl: uploadedImage.url || job.imageFile.preview,
          variations: variations,
          selectedVariationId: `${job.imageFile.id}-var-0`,
        };

        // Add result immediately when this job completes
        setResults(prev => [...prev, newResult]);
        updateJob(job.id, { status: 'done', progress: 100 });

        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        updateJob(job.id, { status: 'error', errorMessage: message, progress: 0 });
        console.error(`Error processing ${job.imageFile.name}:`, error);
        return { success: false, error: message };
      }
    };

    // Fire all jobs in parallel (don't await each one individually)
    try {
      const jobPromises = initialJobs.map(job => processImageJob(job));
      await Promise.all(jobPromises);

      // All jobs completed
      setProgress(100);
      setProgressStatus('All translations complete!');

      // Refresh history from server to get the new entries with correct URLs
      fetchHistory();
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
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
            <>
              <ProcessingQueue jobs={processingJobs} isVisible={true} />
              <ProgressIndicator progress={progress} status={progressStatus} />
            </>
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
