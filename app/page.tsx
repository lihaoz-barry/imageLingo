'use client';

import { useState, useCallback } from 'react';
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

// Default project name for translations
const DEFAULT_PROJECT_NAME = 'Translations';

const languageNames: { [key: string]: string } = {
  'auto': 'Auto',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ar': 'Arabic',
};

const COST_PER_IMAGE = 1; // 1 token per image variation

export default function Home() {
  const { user } = useAuth();

  // State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(500);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [variationsPerImage, setVariationsPerImage] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [results, setResults] = useState<ProcessedImageWithVariations[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  // Real API integration state
  const [projectId, setProjectId] = useState<string | null>(null);

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
    // Check if user is logged in
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const totalCost = images.length * variationsPerImage * COST_PER_IMAGE;

    if (tokenBalance < totalCost) {
      alert(`Insufficient tokens! You need ${totalCost} tokens but only have ${tokenBalance}. Click on your token balance to add more.`);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setProgressStatus('Initializing...');

    const processedResults: ProcessedImageWithVariations[] = [];
    let actualCost = 0; // Track actual cost for images that were successfully processed

    try {
      // Ensure we have a project
      const projId = await ensureProject();
      if (!projId) {
        throw new Error('Failed to create or fetch project');
      }

      // Process all selected images
      let completedTasks = 0;

      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageFile = images[imageIndex];
        
        try {
          // Step 1: Upload image
          setProgressStatus(`Uploading image ${imageIndex + 1}/${images.length}: ${imageFile.name}...`);
          const formData = new FormData();
          formData.append('file', imageFile.file);
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
          
          // Generate multiple variations for this image
          const variations = [];
          let originalUrl = imageFile.preview; // fallback to local preview
          
          for (let varIndex = 0; varIndex < variationsPerImage; varIndex++) {
            setProgressStatus(`Creating variation ${varIndex + 1}/${variationsPerImage} for image ${imageIndex + 1}/${images.length}: ${imageFile.name}...`);
            
            try {
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
                throw new Error(error.error || 'Failed to create generation');
              }

              const { generation: newGeneration } = await genRes.json();

              // Step 3: Start translation
              const translateRes = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  generation_id: newGeneration.id,
                }),
              });

              if (!translateRes.ok) {
                const error = await translateRes.json();
                throw new Error(error.error || 'Translation failed');
              }

              const translateData = await translateRes.json();

              // Use the input_url from first successful translation for consistency
              if (varIndex === 0 && translateData.input_url) {
                originalUrl = translateData.input_url;
              }

              // Add variation to the list
              variations.push({
                id: `${imageFile.id}-var-${varIndex}`,
                url: translateData.output_url || '',
                variationNumber: varIndex + 1,
              });

              // Only increment actual cost for successfully processed variations
              actualCost += COST_PER_IMAGE;
              completedTasks++;
              
              // Calculate progress based on completed vs total requested tasks
              const totalRequestedTasks = images.length * variationsPerImage;
              setProgress(Math.round((completedTasks / totalRequestedTasks) * 100));
            } catch (varError) {
              console.error(`Error creating variation ${varIndex + 1} for image "${imageFile.name}" (${imageIndex + 1}/${images.length}):`, varError);
              // Continue with next variation instead of failing completely
            }
          }

          // Only add result if we have at least one successful variation
          if (variations.length > 0) {
            const newResult: ProcessedImageWithVariations = {
              id: imageFile.id,
              originalName: imageFile.name,
              sourceLanguage: languageNames[sourceLanguage] || 'Auto',
              targetLanguage: languageNames[targetLanguage] || 'Spanish',
              originalUrl,
              variations,
              selectedVariationId: variations[0].id,
            };

            processedResults.push(newResult);
          }
        } catch (imageError) {
          console.error(`Error processing image "${imageFile.name}" (${imageIndex + 1}/${images.length}):`, imageError);
          // Continue with next image instead of failing completely
        }
      }

      // Update results and deduct only the actual cost
      setResults(processedResults);
      setTokenBalance((prev) => prev - actualCost);
      setProgress(100);
      
      // Count total variations across all processed images
      const totalVariations = processedResults.reduce((sum, result) => sum + result.variations.length, 0);
      setProgressStatus(`Translation complete! Processed ${processedResults.length} image(s) with ${totalVariations} variation(s).`);

      // Add to history (only if we have results)
      if (processedResults.length > 0) {
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          date: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          images: processedResults.map(result => ({
            id: result.id,
            originalName: result.originalName,
            sourceLanguage: result.sourceLanguage,
            targetLanguage: result.targetLanguage,
            originalUrl: result.originalUrl,
            processedUrl: result.variations[0].url,
          })),
          sourceLanguage: languageNames[sourceLanguage] || 'Auto',
          targetLanguage: languageNames[targetLanguage] || 'Spanish',
          tokensUsed: actualCost,
        };

        setHistory((prev) => [historyItem, ...prev]);
      }
    } catch (error) {
      console.error('Translation error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setProgressStatus(`Error: ${message}`);
      alert(`Translation failed: ${message}`);
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

  const handleDownload = (imageId: string, variationId: string) => {
    const result = results.find((r) => r.id === imageId);
    if (result) {
      const variation = result.variations.find(v => v.id === variationId);
      if (variation) {
        // In a real app, this would download the actual processed image
        const link = document.createElement('a');
        link.href = variation.url;
        link.download = `localized_${result.originalName}_v${variation.variationNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

      <BillingPanel
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
        currentTokens={tokenBalance}
        onPurchaseTokens={handlePurchaseTokens}
        currentPlan={currentPlan}
        onUpgradePlan={handleUpgradePlan}
      />

      <main className="max-w-6xl mx-auto px-8 pb-16">
        {/* Main Upload Card */}
        <div
          className="rounded-[32px] backdrop-blur-md bg-white/5 border border-white/10 p-8 md:p-12 mb-8"
          style={{
            boxShadow: '0 0 60px rgba(0, 212, 255, 0.15), 0 0 100px rgba(139, 92, 246, 0.1)',
          }}
        >
          <LanguageSelector
            sourceLanguage={sourceLanguage}
            targetLanguage={targetLanguage}
            onSourceChange={setSourceLanguage}
            onTargetChange={setTargetLanguage}
          />

          {/* Variation Selector */}
          <div className="flex justify-center mb-6">
            <VariationSelector
              value={variationsPerImage}
              onChange={setVariationsPerImage}
            />
          </div>

          <UploadZoneWithShowcase
            onFilesSelected={handleFilesSelected}
            hasImages={images.length > 0}
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
            <ProgressIndicator progress={progress} status={progressStatus} />
          )}
        </div>

        {/* Results Section */}
        <ResultsGridWithVariations
          results={results}
          onDownload={handleDownload}
          onSelectVariation={handleSelectVariation}
        />
      </main>
    </div>
  );
}
