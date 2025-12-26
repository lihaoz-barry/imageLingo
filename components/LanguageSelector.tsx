import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { LANGUAGES, type Language } from '@/lib/languages';

interface LanguageSelectorProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceChange: (lang: string) => void;
  onTargetChange: (lang: string) => void;
}

export function LanguageSelector({
  sourceLanguage,
  targetLanguage,
  onSourceChange,
  onTargetChange,
}: LanguageSelectorProps) {
  const [openSelector, setOpenSelector] = useState<'source' | 'target' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggle = (selector: 'source' | 'target') => {
    if (openSelector === selector) {
      setOpenSelector(null);
    } else {
      setSearchQuery('');
      setOpenSelector(selector);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-8">
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 rounded-full backdrop-blur-md bg-white/5 border border-white/10 z-20">

        {/* Source Language Selector */}
        <LanguageDropdown
          label="Source"
          value={sourceLanguage}
          onChange={onSourceChange}
          isOpen={openSelector === 'source'}
          onToggle={() => handleToggle('source')}
          onClose={() => setOpenSelector(null)}
          languages={LANGUAGES}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="w-px h-8 bg-white/20" />

        {/* Target Language Selector */}
        <LanguageDropdown
          label="Target"
          value={targetLanguage}
          onChange={onTargetChange}
          isOpen={openSelector === 'target'}
          onToggle={() => handleToggle('target')}
          onClose={() => setOpenSelector(null)}
          languages={LANGUAGES.filter(l => l.code !== 'auto')}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* Backdrop for closing dropdowns */}
      {openSelector && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setOpenSelector(null)}
        />
      )}
    </div>
  );
}

interface LanguageDropdownProps {
  label: string;
  value: string;
  onChange: (code: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  languages: Language[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

function LanguageDropdown({
  label,
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  languages,
  searchQuery,
  setSearchQuery
}: LanguageDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLang = languages.find(l => l.code === value) || languages[0];

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularLanguages = filteredLanguages.filter(l => l.popular);
  const otherLanguages = filteredLanguages.filter(l => !l.popular);

  const handleSelect = (code: string) => {
    onChange(code);
    onClose();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs text-[#9ca3af] mb-1 cursor-pointer" onClick={onToggle}>{label}</label>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-transparent text-[#00d4ff] cursor-pointer outline-none min-w-[140px] justify-between group"
      >
        <div className="flex items-center gap-2 text-white font-medium">
          <span>{selectedLang?.flag}</span>
          <span>{selectedLang?.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#00d4ff] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu - Fixed centered on mobile, absolute on desktop */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto top-1/4 sm:top-12 sm:left-0 w-auto sm:w-72 max-h-[60vh] sm:max-h-96 bg-[#0f0f2a] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Search Input */}
          <div className="p-3 border-b border-white/10 sticky top-0 bg-[#0f0f2a] z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
            {searchQuery === '' ? (
              <>
                {popularLanguages.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">
                      Popular
                    </div>
                    {popularLanguages.map(lang => (
                      <LanguageOption
                        key={lang.code}
                        lang={lang}
                        isSelected={lang.code === value}
                        onClick={() => handleSelect(lang.code)}
                      />
                    ))}
                  </div>
                )}

                {otherLanguages.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider">
                      All Languages
                    </div>
                    {otherLanguages.map(lang => (
                      <LanguageOption
                        key={lang.code}
                        lang={lang}
                        isSelected={lang.code === value}
                        onClick={() => handleSelect(lang.code)}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map(lang => (
                    <LanguageOption
                      key={lang.code}
                      lang={lang}
                      isSelected={lang.code === value}
                      onClick={() => handleSelect(lang.code)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No languages found
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageOption({ lang, isSelected, onClick }: { lang: Language, isSelected: boolean, onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left group ${isSelected ? 'bg-[#8b5cf6]/20 text-white' : 'text-gray-300 hover:bg-white/5'
        }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{lang.flag}</span>
        <span className={isSelected ? 'font-medium' : ''}>{lang.name}</span>
      </div>
      {isSelected && <Check className="w-4 h-4 text-[#8b5cf6]" />}
    </button>
  );
}
