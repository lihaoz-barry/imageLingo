import { useRef, useState } from 'react';
import { Camera, Upload, Sparkles, Globe, Zap, LayoutGrid } from 'lucide-react';
import { ImageComparisonSlider } from './ImageComparisonSlider';

interface UploadZoneWithShowcaseProps {
  onFilesSelected: (files: File[]) => void;
  hasImages: boolean;
}

const showcaseExamples = [
  {
    before: '/images/showcase/product-cn.jpg',
    after: '/images/showcase/product-en.jpg',
    beforeLabel: 'Chinese',
    afterLabel: 'English',
    title: 'Product Packaging',
  },
];

export function UploadZoneWithShowcase({ onFilesSelected, hasImages }: UploadZoneWithShowcaseProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentExample, setCurrentExample] = useState(0);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
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

      {/* Showcase Mode (when no images) */}
      {!hasImages && !isDragging && (
        <div className="p-8">
          {/* Feature Description */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8b5cf6]/20 to-[#c026d3]/20 border border-[#8b5cf6]/30 mb-4">
              <Sparkles className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-sm text-[#00d4ff]">See ImageLingo in Action</span>
            </div>
            <h3 className="text-2xl text-white mb-3">
              Transform Images Across Languages
            </h3>
            <p className="text-[#9ca3af] max-w-2xl mx-auto">
              Drag the slider to see how ImageLingo translates text while preserving your original design and layout perfectly
            </p>
          </div>

          {/* Interactive Before/After Slider */}
          <div className="mb-6">
            <ImageComparisonSlider
              beforeImage={showcaseExamples[currentExample].before}
              afterImage={showcaseExamples[currentExample].after}
              beforeLabel={showcaseExamples[currentExample].beforeLabel}
              afterLabel={showcaseExamples[currentExample].afterLabel}
            />
          </div>

          {/* Example Selector */}
          {showcaseExamples.length > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {showcaseExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentExample(idx)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${currentExample === idx
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#c026d3] text-white'
                    : 'bg-white/5 text-[#9ca3af] hover:bg-white/10'
                    }`}
                >
                  {example.title}
                </button>
              ))}
            </div>
          )}

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-white text-sm mb-1">30+ Languages</h4>
              <p className="text-xs text-[#9ca3af]">
                Support for all major languages with auto-detection
              </p>
            </div>

            <div className="p-4 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-white text-sm mb-1">Layout Preserved</h4>
              <p className="text-xs text-[#9ca3af]">
                Maintains original design, fonts, and positioning
              </p>
            </div>

            <div className="p-4 rounded-xl backdrop-blur-md bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#c026d3] flex items-center justify-center mb-3">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-white text-sm mb-1">AI-Powered</h4>
              <p className="text-xs text-[#9ca3af]">
                Advanced AI for accurate translation and rendering
              </p>
            </div>
          </div>

          {/* Upload CTA */}
          <div
            onClick={handleClick}
            className="p-8 rounded-2xl border-2 border-dashed border-[#8b5cf6]/50 hover:border-[#8b5cf6] hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <Camera className="w-12 h-12 text-[#8b5cf6] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                <Upload className="w-5 h-5 text-[#00d4ff] absolute -bottom-1 -right-1" />
              </div>

              <div className="text-center">
                <p className="text-lg text-white mb-1">
                  Ready to try? Upload your images
                </p>
                <p className="text-sm text-[#9ca3af]">
                  Drag & drop or click to browse • Max 10 images, 10MB each
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Mode (when dragging or has images) */}
      {(isDragging || hasImages) && (
        <div onClick={handleClick} className="p-16 cursor-pointer">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Camera className="w-16 h-16 text-[#8b5cf6]" strokeWidth={1.5} />
              <Upload className="w-6 h-6 text-[#00d4ff] absolute -bottom-1 -right-1" />
            </div>

            <div className="text-center">
              <p className="text-xl text-white mb-2">
                {isDragging ? 'Drop images here' : 'Add more images'}
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
      )}
    </div>
  );
}
