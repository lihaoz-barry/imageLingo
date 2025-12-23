interface ProgressIndicatorProps {
  progress: number;
  status: string;
}

export function ProgressIndicator({ progress, status }: ProgressIndicatorProps) {
  return (
    <div className="mt-8 p-6 rounded-3xl backdrop-blur-md bg-white/5 border border-white/10">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[#9ca3af]">{status}</span>
        <span className="text-[#00d4ff]">{progress}%</span>
      </div>
      
      <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] transition-all duration-500 shimmer rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
