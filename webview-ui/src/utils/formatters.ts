/**
 * Utility functions for formatting and display
 */

/**
 * Formats seconds into a human-readable time string
 * @param seconds - The time in seconds
 * @returns A formatted string like "2h 30m" or "45s"
 * @example
 * ```typescript
 * formatTime(3600) // Returns "1h"
 * formatTime(9000) // Returns "2h 30m"
 * formatTime(45) // Returns "45s"
 * ```
 */
export const formatTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${seconds}s`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(`${hours}h`);
    }
    if (minutes > 0) {
        parts.push(`${minutes}m`);
    }
    if (remainingSeconds > 0) {
        parts.push(`${remainingSeconds}s`);
    }

    return parts.join(' ');
};
