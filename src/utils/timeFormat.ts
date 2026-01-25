/**
 * Formats a time value in seconds to MM:SS format.
 * 
 * This function converts a number of seconds into a human-readable
 * time string in the format MM:SS (minutes:seconds), with leading
 * zeros for single-digit values.
 * 
 * @param seconds - The time in seconds to format (non-negative integer)
 * @returns A string in MM:SS format
 * 
 * @example
 * formatTime(0);    // "00:00"
 * formatTime(59);   // "00:59"
 * formatTime(60);   // "01:00"
 * formatTime(125);  // "02:05"
 * formatTime(3661); // "61:01"
 * 
 * @remarks
 * - Negative values are treated as 0
 * - Fractional seconds are floored to the nearest integer
 * - Minutes can exceed 59 (e.g., 61:01 for 3661 seconds)
 */
export function formatTime(seconds: number): string {
  // Handle negative values and ensure we have an integer
  const totalSeconds = Math.max(0, Math.floor(seconds));
  
  // Calculate minutes and remaining seconds
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  
  // Format with leading zeros
  const minutesStr = String(minutes).padStart(2, '0');
  const secondsStr = String(remainingSeconds).padStart(2, '0');
  
  return `${minutesStr}:${secondsStr}`;
}
