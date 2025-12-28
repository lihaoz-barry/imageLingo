/**
 * Format milliseconds to a human-readable time string
 * Examples: 1234 -> "1.2s", 45678 -> "45.7s", 123456 -> "2.1m"
 */
export function formatProcessingTime(ms: number | undefined | null): string {
  if (ms === undefined || ms === null || ms <= 0) {
    return '';
  }

  const seconds = ms / 1000;

  // Less than 60 seconds - show with 1 decimal place
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  // 60 seconds or more - show minutes with 1 decimal place
  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}
