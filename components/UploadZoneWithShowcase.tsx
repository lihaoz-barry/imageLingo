import { useRef, useState, useEffect } from 'react';
import { Camera, Upload, Info } from 'lucide-react';
interface UploadZoneWithShowcaseProps {
  onFilesSelected: (files: File[]) => void;
  hasImages: boolean;
  isShowcaseOpen: boolean;
  setIsShowcaseOpen: (val: boolean | ((p: boolean) => boolean)) => void;
}

export function UploadZoneWithShowcase({
  onFilesSelected,
  hasImages,
  isShowcaseOpen,
  setIsShowcaseOpen
}: UploadZoneWithShowcaseProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if first time user
  useEffect(() => {
    const hasSeenShowcase = localStorage.getItem('imageLingo_hasSeenShowcase');
    if (!hasSeenShowcase) {
      // Use queueMicrotask to avoid synchronous setState within effect
      queueMicrotask(() => {
        setIsShowcaseOpen(true);
      });
      localStorage.setItem('imageLingo_hasSeenShowcase', 'true');
    }
  }, [setIsShowcaseOpen]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl overflow-hidden
          transition-all duration-300
          ${isDragging
            ? 'border-[#00d4ff] bg-[#00d4ff]/10'
            : 'border-[#c026d3] hover:border-[#8b5cf6]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Help Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsShowcaseOpen((val) => !val);
          }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#9ca3af] hover:text-white transition-colors border border-white/10 group"
          title="How it works"
          aria-label="How it works"
        >
          <Info className="w-5 h-5 text-[#8b5cf6] group-hover:text-[#00d4ff] transition-colors" />
        </button>

        {/* Upload Area */}
        <div
          onClick={handleClick}
          className="p-16 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d4ff] rounded-xl"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Camera className="w-16 h-16 text-[#8b5cf6]" strokeWidth={1.5} />
              <Upload className="w-6 h-6 text-[#00d4ff] absolute -bottom-1 -right-1" />
            </div>

            <div className="text-center">
              <p className="text-xl text-white mb-2">
                {isDragging ? 'Drop images here' : (hasImages ? 'Add more images' : 'Upload images to start')}
              </p>
              <p className="text-[#9ca3af]">
                or click to browse
              </p>
              <p className="text-xs text-[#9ca3af] mt-4">
                Supports JPG, PNG, GIF, WebP, BMP • Max 10 images, 10MB each
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
