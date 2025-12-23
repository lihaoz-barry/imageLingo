import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

interface CostCalculatorProps {
  imageCount: number;
  variationsPerImage: number;
  costPerImage: number;
}

export function CostCalculator({ imageCount, variationsPerImage, costPerImage }: CostCalculatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const totalCost = imageCount * variationsPerImage * costPerImage;

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md bg-white/5 border border-white/10">
        <span className="text-[#9ca3af] text-sm">Cost:</span>
        <span className="text-[#00d4ff]">{totalCost}</span>
        <span className="text-xs text-[#9ca3af]">tokens</span>
      </div>
      
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-8 h-8 rounded-full backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
      >
        <HelpCircle className="w-4 h-4 text-[#9ca3af]" />
      </button>

      {showDetails && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute top-12 right-0 z-50 w-80 p-6 rounded-2xl backdrop-blur-md bg-[#1a1a3e]/95 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white">Cost Breakdown</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-[#9ca3af]" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Images:</span>
                <span className="text-white">{imageCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Variations per image:</span>
                <span className="text-white">{variationsPerImage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Cost per variation:</span>
                <span className="text-white">{costPerImage} token</span>
              </div>
              
              <div className="h-px bg-white/10 my-3" />
              
              <div className="flex justify-between">
                <span className="text-white">Total Cost:</span>
                <span className="text-[#00d4ff]">
                  {imageCount} × {variationsPerImage} × {costPerImage} = {totalCost} tokens
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20">
              <p className="text-xs text-[#00d4ff]">
                💡 Tip: Process fewer variations to save tokens, or upgrade for bulk discounts!
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
