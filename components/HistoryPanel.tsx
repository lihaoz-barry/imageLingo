import { X, Calendar, Languages, Download, Trash2 } from 'lucide-react';
import { ProcessedImage } from './ResultsGrid';

export interface HistoryItem {
  id: string;
  date: string;
  images: ProcessedImage[];
  sourceLanguage: string;
  targetLanguage: string;
  tokensUsed: number;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onDeleteHistory: (id: string) => void;
}

export function HistoryPanel({ isOpen, onClose, history, onLoadHistory, onDeleteHistory }: HistoryPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-gradient-to-b from-[#0d0d2b] to-[#2d1b69] border-l border-white/10 z-50 overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-b from-[#0d0d2b] to-transparent backdrop-blur-md z-10 p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6] bg-clip-text text-transparent">
              Processing History
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-[#9ca3af]" />
              </div>
              <p className="text-[#9ca3af]">No processing history yet</p>
              <p className="text-sm text-[#9ca3af] mt-2">
                Your completed jobs will appear here
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-[#9ca3af]" />
                      <span className="text-sm text-[#9ca3af]">{item.date}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Languages className="w-4 h-4 text-[#9ca3af]" />
                      <span className="text-sm text-white">
                        {item.sourceLanguage} → {item.targetLanguage}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-[#9ca3af]">
                      <span>{item.images.length} {item.images.length === 1 ? 'image' : 'images'}</span>
                      <span>•</span>
                      <span className="text-[#00d4ff]">{item.tokensUsed} tokens</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onDeleteHistory(item.id)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-red-500/20 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Thumbnail Preview */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {item.images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-black/30 border border-white/10"
                    >
                      <img
                        src={img.processedUrl}
                        alt={img.originalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {item.images.length > 4 && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-xs text-[#9ca3af]">
                        +{item.images.length - 4}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onLoadHistory(item)}
                  className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] hover:from-[#9d6ef7] hover:to-[#d137e4] transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  View Results
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
