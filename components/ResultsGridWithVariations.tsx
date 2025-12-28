import { Download, ArrowRight, Check, Clock } from 'lucide-react';
import { useState } from 'react';
import { ImagePreviewModal } from './ImagePreviewModal';
import { formatProcessingTime } from '@/lib/time-utils';

export interface ImageVariation {
  id: string;
  url: string;
  variationNumber: number;
  processingMs?: number;
}

export interface ProcessedImageWithVariations {
  id: string;
  originalName: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageCode: string;
  originalUrl: string;
  variations: ImageVariation[];
  selectedVariationId?: string;
}

interface ResultsGridWithVariationsProps {
  results: ProcessedImageWithVariations[];
  onDownload: (imageId: string, variationId: string) => void;
  onSelectVariation: (imageId: string, variationId: string) => void;
}

export function ResultsGridWithVariations({
  results,
  onDownload,
  onSelectVariation
}: ResultsGridWithVariationsProps) {
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
  } | null>(null);

  if (results.length === 0) return null;

  return (
    <>
      <ImagePreviewModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url || ''}
        imageName={previewImage?.name || ''}
        onClose={() => setPreviewImage(null)}
      />
      <div className="mt-12">
        <h2 className="mb-6 bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent">
          Localized Results
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {results.map((result) => {
            const selectedVariation = result.variations.find(
              v => v.id === result.selectedVariationId
            ) || result.variations[0];

            return (
              <div
                key={result.id}
                className="group rounded-3xl backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden hover:border-[#00d4ff]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-white truncate flex-1" title={result.originalName}>
                      {result.originalName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4 text-xs">
                    <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6]">
                      {result.sourceLanguage}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#9ca3af]" />
                    <span className="px-3 py-1 rounded-full bg-[#00d4ff]/20 text-[#00d4ff]">
                      {result.targetLanguage}
                    </span>
                    <span className="ml-auto text-[#9ca3af]">
                      {result.variations.length} {result.variations.length === 1 ? 'variation' : 'variations'}
                    </span>
                  </div>

                  {/* Main Preview */}
                  <div
                    className="relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-4 cursor-pointer group/preview"
                    onClick={() => setPreviewImage({
                      url: selectedVariation.url,
                      name: `localized_${result.originalName}_v${selectedVariation.variationNumber}.png`
                    })}
                  >
                    <img
                      src={selectedVariation.url}
                      alt={`${result.originalName} - Variation ${selectedVariation.variationNumber}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/preview:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white text-sm opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 bg-black/50 px-3 py-1.5 rounded-lg">
                        Click to preview
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg backdrop-blur-md bg-black/50 text-xs text-white">
                      Variation {selectedVariation.variationNumber}
                    </div>
                    {selectedVariation.processingMs && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg backdrop-blur-md bg-black/50 text-xs text-[#8b5cf6] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatProcessingTime(selectedVariation.processingMs)}
                      </div>
                    )}
                  </div>

                  {/* Variation Thumbnails */}
                  {result.variations.length > 1 && (
                    <div className="mb-4">
                      <p className="text-xs text-[#9ca3af] mb-2">Select variation:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {result.variations.map((variation) => (
                          <button
                            key={variation.id}
                            onClick={() => onSelectVariation(result.id, variation.id)}
                            className={`
                            relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all
                            ${variation.id === selectedVariation.id
                                ? 'border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                                : 'border-white/20 hover:border-white/40'
                              }
                          `}
                          >
                            <img
                              src={variation.url}
                              alt={`Variation ${variation.variationNumber}`}
                              className="w-full h-full object-cover"
                            />
                            {variation.id === selectedVariation.id && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#00d4ff] flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white">
                              #{variation.variationNumber}
                            </div>
                            {variation.processingMs && (
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-[#8b5cf6] flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {formatProcessingTime(variation.processingMs)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => onDownload(result.id, selectedVariation.id)}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Selected</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
