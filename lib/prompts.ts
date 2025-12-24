/**
 * Declarative prompt templates for Gemini image translation
 *
 * This file contains all prompts used for AI image translation.
 * Update PROMPT_VERSION when making changes to track which version was used.
 */

export const PROMPT_VERSION = '1.0.0';

/**
 * Supported languages for translation
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'auto': 'Auto-detect',
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ar': 'Arabic',
};

/**
 * Get the display name for a language code
 */
export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code] || code;
}

/**
 * Main translation prompt template
 *
 * This prompt instructs Gemini to:
 * 1. Identify all text in the image
 * 2. Translate text to target language
 * 3. Generate a new image with translated text
 * 4. Preserve original styling and layout
 */
export function getTranslationPrompt(
  sourceLanguage: string,
  targetLanguage: string
): string {
  const sourceLang = sourceLanguage === 'auto'
    ? 'the original language (auto-detect)'
    : getLanguageName(sourceLanguage);

  const targetLang = getLanguageName(targetLanguage);

  return `You are an expert image translator and graphic designer. Your task is to translate all text in this image from ${sourceLang} to ${targetLang}.

INSTRUCTIONS:
1. Identify ALL text elements in the image (headings, labels, captions, buttons, etc.)
2. Translate each text element to ${targetLang}
3. Generate a NEW version of the image with the translated text
4. PRESERVE the original image's:
   - Visual style and aesthetics
   - Layout and composition
   - Font styles and sizing (use similar fonts appropriate for ${targetLang})
   - Colors and design elements
   - All non-text elements (images, icons, graphics)

IMPORTANT GUIDELINES:
- Maintain visual consistency with the original
- Ensure translated text fits naturally in the same positions
- Use culturally appropriate typography for ${targetLang}
- Keep text readable and properly sized
- Do NOT add, remove, or modify any non-text elements
- If text doesn't fit, adjust font size slightly rather than truncating

OUTPUT: Generate the translated image only. Do not include any explanatory text.`;
}

/**
 * Alternative prompt styles for A/B testing
 * These can be enabled by changing the active prompt in getTranslationPrompt
 */
export const PROMPT_VARIANTS = {
  /**
   * Concise version - shorter prompt for faster processing
   */
  concise: (sourceLang: string, targetLang: string) =>
    `Translate all text in this image from ${sourceLang} to ${targetLang}.
     Generate a new image with translated text while preserving the original style, layout, and design.
     Keep all non-text elements unchanged.`,

  /**
   * Detailed version - more specific instructions for complex images
   */
  detailed: (sourceLang: string, targetLang: string) =>
    `As a professional translator and graphic designer, translate this image:

     SOURCE LANGUAGE: ${sourceLang}
     TARGET LANGUAGE: ${targetLang}

     Step-by-step process:
     1. Scan the entire image for text (including small labels, watermarks, embedded text)
     2. Create accurate translations maintaining original meaning and tone
     3. Select appropriate fonts that match the original style and support ${targetLang} characters
     4. Position translated text exactly where original text appeared
     5. Adjust kerning/spacing as needed for the target language
     6. Verify all graphical elements remain unchanged
     7. Output the final translated image

     Quality checks:
     - Text is fully readable
     - No text is cut off or overlapping
     - Colors match the original
     - Overall composition is preserved`,
};
