import { ChevronDown } from 'lucide-react';

interface VariationSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
}

const variationOptions = [1, 2, 3, 4, 5];

export function VariationSelector({ value, onChange, label = "Variations per image" }: VariationSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-[#9ca3af]">{label}:</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="px-4 py-2 pr-10 rounded-full backdrop-blur-md bg-white/10 border border-white/20 text-[#00d4ff] cursor-pointer outline-none appearance-none hover:bg-white/15 transition-all font-semibold"
          aria-label={`Select number of variations per image. Currently ${value} ${value === 1 ? 'variation' : 'variations'} selected.`}
        >
          {variationOptions.map((num) => (
            <option key={num} value={num} className="bg-[#1a1a3e] text-white">
              {num} {num === 1 ? 'variation' : 'variations'}
            </option>
          ))}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#00d4ff] pointer-events-none" />
      </div>
      <span className="text-xs text-[#00d4ff] font-medium">
        ({value} {value === 1 ? 'variation' : 'variations'} selected)
      </span>
    </div>
  );
}
