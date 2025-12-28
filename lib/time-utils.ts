/**
 * Format milliseconds to a human-readable time string
 * Examples: 0 -> "0.0s", 1234 -> "1.2s", 45678 -> "45.7s", 123456 -> "2.1m", 3723456 -> "1.0h"
 * Returns empty string for null/undefined inputs
 */
export function formatProcessingTime(ms: number | undefined | null): string {
  if (ms === undefined || ms === null) {
    return '';
  }

  // Handle negative values as invalid
  if (ms < 0) {
    return '';
  }

  const seconds = ms / 1000;

  // Less than 60 seconds - show with 1 decimal place
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  // 60 seconds to less than 60 minutes - show minutes with 1 decimal place
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(1)}m`;
  }

  // 60 minutes or more - show hours with 1 decimal place
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}
