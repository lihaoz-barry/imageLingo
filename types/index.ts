/**
 * Error handling and retry tracking types
 */

export interface FailedVariation {
  variationNumber: number;
  errorCode: string;
  errorMessage: string;
  isRetryable: boolean;
  attemptNumber: number; // Which attempt failed (1, 2, 3)
}

export interface ErrorLogEntry {
  id: string;
  generation_id: string;
  user_id: string;
  error_code: string;
  error_message: string;
  attempt_number: number;
  created_at: string;
}

export interface TranslationErrorResponse {
  error: string;
  error_code: string;
  retryable: boolean;
}
