import { CheckCircle, X } from 'lucide-react';

export interface ImageFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

interface ImageThumbnailsProps {
  images: ImageFile[];
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function ImageThumbnails({ images, onRemove }: ImageThumbnailsProps) {
  if (images.length === 0) return null;

  return (
    <div className="mt-8 p-6 rounded-3xl backdrop-blur-md bg-white/5 border border-white/10">
      <h3 className="mb-4 text-[#9ca3af]">
        Selected Images ({images.length})
      </h3>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative group flex-shrink-0"
          >
            <div className="w-28 h-28 rounded-xl overflow-hidden border border-white/20 bg-black/30">
              <img
                src={image.preview}
                alt={image.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="absolute top-2 right-2">
              <CheckCircle className="w-5 h-5 text-[#00d4ff] fill-[#00d4ff]/20" />
            </div>
            
            <button
              onClick={() => onRemove(image.id)}
              className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mt-2 w-28">
              <p className="text-xs text-white truncate" title={image.name}>
                {image.name}
              </p>
              <p className="text-xs text-[#9ca3af]">
                {formatFileSize(image.size)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
