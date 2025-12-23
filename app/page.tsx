'use client';

import { useState } from 'react';
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
import { ResultsGridWithVariations, type ProcessedImageWithVariations, type ImageVariation } from '@/components/ResultsGridWithVariations';
import { HistoryPanel, type HistoryItem } from '@/components/HistoryPanel';
import { BillingPanel } from '@/components/BillingPanel';

// Mock processed image URLs for demo
const mockProcessedImages = [
  'https://images.unsplash.com/photo-1687580713037-e2192ed77cb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHByb2R1Y3QlMjBsYWJlbHxlbnwxfHx8fDE3NjQ5MjE3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1645453015291-0a80bbdeeea6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwbWVudSUyMGZvb2R8ZW58MXx8fHwxNzY0OTIxNzk2fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1554296759-ec7c058ecf9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBzaWduYWdlJTIwdGV4dHxlbnwxfHx8fDE3NjQ5MjE3OTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1659662281284-f5a841850bfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbmVzZSUyMHByb2R1Y3QlMjBwYWNrYWdpbmd8ZW58MXx8fHwxNzY0OTIyNDA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1706341764900-bd6660e9f26d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluZXNlJTIwcmVzdGF1cmFudCUyMG1lbnV8ZW58MXx8fHwxNzY0OTIyNDA3fDA&ixlib=rb-4.1.0&q=80&w=1080',
];

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
    const totalCost = images.length * variationsPerImage * COST_PER_IMAGE;

    if (tokenBalance < totalCost) {
      alert(`Insufficient tokens! You need ${totalCost} tokens but only have ${tokenBalance}. Click on your token balance to add more.`);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const stages = [
      { progress: 15, status: 'Analyzing images with AI...' },
      { progress: 35, status: 'Detecting text regions...' },
      { progress: 55, status: 'Translating content...' },
      { progress: 75, status: `Generating ${variationsPerImage} variations per image...` },
      { progress: 90, status: 'Rendering localized images...' },
      { progress: 100, status: 'Complete!' },
    ];

    for (const stage of stages) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(stage.progress);
      setProgressStatus(stage.status);
    }

    // Generate variations for each image
    const processedResults: ProcessedImageWithVariations[] = images.map((image, imageIndex) => {
      const variations: ImageVariation[] = Array.from({ length: variationsPerImage }, (_, varIndex) => ({
        id: `${image.id}-var-${varIndex}`,
        url: mockProcessedImages[(imageIndex * variationsPerImage + varIndex) % mockProcessedImages.length],
        variationNumber: varIndex + 1,
      }));

      return {
        id: image.id,
        originalName: image.name,
        sourceLanguage: languageNames[sourceLanguage] || 'Auto',
        targetLanguage: languageNames[targetLanguage] || 'Spanish',
        originalUrl: image.preview,
        variations,
        selectedVariationId: variations[0].id,
      };
    });

    setResults(processedResults);
    setTokenBalance(prev => prev - totalCost);

    // Add to history
    const historyItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      images: processedResults.map(r => ({
        id: r.id,
        originalName: r.originalName,
        sourceLanguage: r.sourceLanguage,
        targetLanguage: r.targetLanguage,
        originalUrl: r.originalUrl,
        processedUrl: r.variations[0].url,
      })),
      sourceLanguage: languageNames[sourceLanguage] || 'Auto',
      targetLanguage: languageNames[targetLanguage] || 'Spanish',
      tokensUsed: totalCost,
    };

    setHistory(prev => [historyItem, ...prev]);
    setIsProcessing(false);
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
