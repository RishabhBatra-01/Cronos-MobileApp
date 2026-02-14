/**
 * Duration Utilities for ISO 8601 Duration Format
 * 
 * Handles parsing and manipulation of ISO 8601 durations for pre-notifications.
 * Format: PT[n]D[n]H[n]M
 * Examples: PT5M (5 minutes), PT1H (1 hour), PT1D (1 day)
 */

/**
 * Subtract ISO 8601 duration from date
 * @param date - Base date
 * @param duration - ISO 8601 duration (e.g., "PT5M", "PT1H", "PT1D")
 * @returns New date with duration subtracted
 */
export function subtractDuration(date: Date, duration: string): Date {
    const ms = parseDuration(duration);
    return new Date(date.getTime() - ms);
}

/**
 * Parse ISO 8601 duration to milliseconds
 * @param duration - ISO 8601 duration string
 * @returns Duration in milliseconds
 * @throws Error if duration format is invalid
 */
export function parseDuration(duration: string): number {
    // Match PT[n]D[n]H[n]M format
    // Examples: PT5M, PT1H, PT2H30M, PT1D
    const regex = /^PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?$/;
    const match = duration.match(regex);
    
    if (!match) {
        throw new Error(`Invalid ISO 8601 duration format: ${duration}`);
    }
    
    const days = parseInt(match[1] || '0', 10);
    const hours = parseInt(match[2] || '0', 10);
    const minutes = parseInt(match[3] || '0', 10);
    
    // Convert to milliseconds
    return (days * 24 * 60 * 60 * 1000) +
           (hours * 60 * 60 * 1000) +
           (minutes * 60 * 1000);
}

/**
 * Format duration for human-readable display
 * @param duration - ISO 8601 duration string
 * @returns Human-readable string (e.g., "5 minutes", "1 hour", "2 days")
 */
export function formatDuration(duration: string): string {
    try {
        const ms = parseDuration(duration);
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        }
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } catch (error) {
        console.error('[DurationUtils] Format error:', error);
        return duration; // Fallback to raw duration
    }
}

/**
 * Get display label for common durations
 * @param duration - ISO 8601 duration string
 * @returns Display label
 */
export function getDurationLabel(duration: string): string {
    const labels: Record<string, string> = {
        'PT5M': '5 minutes before',
        'PT15M': '15 minutes before',
        'PT30M': '30 minutes before',
        'PT1H': '1 hour before',
        'PT2H': '2 hours before',
        'PT1D': '1 day before',
    };
    
    return labels[duration] || formatDuration(duration);
}

/**
 * Common pre-notification offset options
 */
export const COMMON_OFFSETS = [
    { value: 'PT5M', label: '5 minutes before' },
    { value: 'PT15M', label: '15 minutes before' },
    { value: 'PT30M', label: '30 minutes before' },
    { value: 'PT1H', label: '1 hour before' },
    { value: 'PT2H', label: '2 hours before' },
    { value: 'PT1D', label: '1 day before' },
] as const;
