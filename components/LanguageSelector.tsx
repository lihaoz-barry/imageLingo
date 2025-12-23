import { ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
}

const languages = [
  { code: 'auto', name: 'Auto-Detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish (ES)', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
];

export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
}: LanguageSelectorProps) {
  const sourceSelected = languages.find(l => l.code === sourceLanguage);
  const targetSelected = languages.find(l => l.code === targetLanguage);

  return (
    <div className="flex items-center justify-center gap-4 mb-8">
      <div className="flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-md bg-white/5 border border-white/10">
        <div className="relative">
          <label className="block text-xs text-[#9ca3af] mb-1">Source</label>
          <select
            value={sourceLanguage}
            onChange={(e) => onSourceChange(e.target.value)}
            className="bg-transparent text-[#00d4ff] cursor-pointer outline-none appearance-none pr-6"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#1a1a3e] text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-0 top-7 text-[#00d4ff] pointer-events-none" />
        </div>

        <div className="w-px h-8 bg-white/20" />

        <div className="relative">
          <label className="block text-xs text-[#9ca3af] mb-1">Target</label>
          <select
            value={targetLanguage}
            onChange={(e) => onTargetChange(e.target.value)}
            className="bg-transparent text-[#00d4ff] cursor-pointer outline-none appearance-none pr-6"
          >
            {languages.filter(l => l.code !== 'auto').map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-[#1a1a3e] text-white">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-0 top-7 text-[#00d4ff] pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
