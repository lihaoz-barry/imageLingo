import { Loader2, Sparkles } from 'lucide-react';

interface ProcessButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

export function ProcessButton({ onClick, disabled, isProcessing }: ProcessButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative mt-8 px-12 py-4 rounded-full
        bg-gradient-to-r from-[#8b5cf6] via-[#c026d3] to-[#c026d3]
        transition-all duration-300
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:scale-105 hover:shadow-[0_0_40px_rgba(192,38,211,0.6)]'
        }
        ${isProcessing ? 'animate-pulse' : ''}
      `}
      style={{
        boxShadow: '0 10px 40px rgba(192, 38, 211, 0.3)',
      }}
    >
      <span className="flex items-center gap-3">
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Process Images</span>
          </>
        )}
      </span>
    </button>
  );
}
