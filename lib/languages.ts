export interface Language {
    code: string;
    name: string;
    flag: string;
    popular?: boolean;
}

export const LANGUAGES: Language[] = [
    { code: 'auto', name: 'Auto-Detect', flag: '🌐', popular: true },
    { code: 'en', name: 'English', flag: '🇬🇧', popular: true },
    { code: 'es', name: 'Spanish', flag: '🇪🇸', popular: true },
    { code: 'fr', name: 'French', flag: '🇫🇷', popular: true },
    { code: 'de', name: 'German', flag: '🇩🇪', popular: true },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳', popular: true },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵', popular: true },
    { code: 'ko', name: 'Korean', flag: '🇰🇷', popular: true },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
];

export const LANGUAGE_NAMES: { [key: string]: string } = LANGUAGES.reduce((acc, lang) => {
    acc[lang.code] = lang.name;
    return acc;
}, {} as { [key: string]: string });
