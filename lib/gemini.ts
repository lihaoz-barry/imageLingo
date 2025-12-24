/**
 * Gemini API client wrapper for image translation
 *
 * This module provides a simplified interface to the Google Gemini API
 * specifically for image-to-image translation tasks.
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Custom error class for Gemini API errors
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONFIG_ERROR' | 'API_ERROR' | 'NO_IMAGE' | 'RATE_LIMIT',
    public readonly retryable: boolean
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Gemini model configuration for image translation
 */
const GEMINI_CONFIG = {
  responseModalities: ['IMAGE', 'TEXT'] as string[],
  imageConfig: {
    imageSize: '1K' as const,
  },
};

/**
 * Model to use for image translation
 * Using gemini-2.0-flash-exp as it supports image generation
 */
const MODEL = 'gemini-2.0-flash-exp';

/**
 * Result of image translation
 */
export interface TranslateImageResult {
  imageBuffer: Buffer;
  mimeType: string;
}

/**
 * Translate text in an image using Gemini API
 *
 * @param imageBuffer - The source image as a Buffer
 * @param mimeType - MIME type of the source image (e.g., 'image/jpeg')
 * @param prompt - The translation instruction prompt
 * @returns Promise with the translated image buffer and mime type
 * @throws GeminiError on failure
 */
export async function translateImage(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string
): Promise<TranslateImageResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new GeminiError(
      'GEMINI_API_KEY environment variable is not configured',
      'CONFIG_ERROR',
      false
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the content with image and prompt
  const contents = [
    {
      role: 'user' as const,
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: imageBuffer.toString('base64'),
          },
        },
      ],
    },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model: MODEL,
      config: GEMINI_CONFIG,
      contents,
    });

    // Process streaming response to find the generated image
    for await (const chunk of response) {
      const candidate = chunk.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (parts) {
        for (const part of parts) {
          // Check if this part contains inline image data
          if ('inlineData' in part && part.inlineData) {
            const inlineData = part.inlineData;
            if (inlineData.data && inlineData.mimeType) {
              return {
                imageBuffer: Buffer.from(inlineData.data, 'base64'),
                mimeType: inlineData.mimeType,
              };
            }
          }
        }
      }
    }

    // If we got here, no image was returned
    throw new GeminiError(
      'Gemini API did not return an image in the response',
      'NO_IMAGE',
      false
    );
  } catch (error) {
    // Re-throw GeminiError instances
    if (error instanceof GeminiError) {
      throw error;
    }

    // Handle other errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for rate limit errors
    if (message.toLowerCase().includes('rate limit') ||
        message.toLowerCase().includes('quota') ||
        message.toLowerCase().includes('429')) {
      throw new GeminiError(
        'Gemini API rate limit exceeded. Please try again later.',
        'RATE_LIMIT',
        true
      );
    }

    // Check for timeout errors
    if (message.toLowerCase().includes('timeout') ||
        message.toLowerCase().includes('deadline')) {
      throw new GeminiError(
        'Gemini API request timed out. Please try again.',
        'API_ERROR',
        true
      );
    }

    throw new GeminiError(message, 'API_ERROR', false);
  }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
