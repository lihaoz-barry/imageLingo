import { Download, ArrowRight } from 'lucide-react';

export interface ProcessedImage {
  id: string;
  originalName: string;
  sourceLanguage: string;
  targetLanguage: string;
  targetLanguageCode?: string;
  originalUrl: string;
  processedUrl: string;
  processingMs?: number;
}

interface ResultsGridProps {
  results: ProcessedImage[];
  onDownload: (id: string) => void;
}

export function ResultsGrid({ results, onDownload }: ResultsGridProps) {
  if (results.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="mb-6 bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent">
        Localized Results
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <div
            key={result.id}
            className="group rounded-3xl backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden hover:border-[#00d4ff]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,255,0.2)]"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white truncate" title={result.originalName}>
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
              </div>
              
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/30 mb-4">
                <img
                  src={result.processedUrl}
                  alt={`Localized ${result.originalName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <button
                onClick={() => onDownload(result.id)}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
