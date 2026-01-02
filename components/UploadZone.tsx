import { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function UploadZone({ onFilesSelected }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload images"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-3xl p-16 cursor-pointer
        transition-all duration-300 outline-none
        ${isDragging 
          ? 'border-[#00d4ff] bg-[#00d4ff]/10' 
          : 'border-[#c026d3] hover:border-[#8b5cf6] hover:bg-white/5 focus-visible:border-[#8b5cf6] focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/50'
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
      
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Camera className="w-16 h-16 text-[#8b5cf6]" strokeWidth={1.5} />
          <Upload className="w-6 h-6 text-[#00d4ff] absolute -bottom-1 -right-1" />
        </div>
        
        <div className="text-center">
          <p className="text-xl text-white mb-2">
            Drag & drop images
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
  );
}
