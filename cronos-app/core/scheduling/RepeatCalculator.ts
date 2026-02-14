import { Task, RepeatType, DailyRepeatConfig, WeeklyRepeatConfig, MonthlyRepeatConfig } from '../store/useTaskStore';

/**
 * Calculate the next occurrence for a repeating task
 * Based on Master Spec: Uses stored ISO timestamp (absolute instant)
 * 
 * @param task - The task to calculate next occurrence for
 * @returns ISO timestamp string of next occurrence, or null if no repeat
 */
export function calculateNextOccurrence(task: Task): string | null {
    console.log('[RepeatCalculator] Calculating next occurrence for task:', task.id);
    
    // Check if task has repeat configured
    if (!task.repeatType || task.repeatType === 'NONE' || !task.repeatConfig) {
        console.log('[RepeatCalculator] No repeat configured');
        return null;
    }
    
    // Get the last trigger time (use dueDate as the base)
    if (!task.dueDate) {
        console.log('[RepeatCalculator] No due date, cannot calculate next occurrence');
        return null;
    }
    
    const lastTrigger = new Date(task.dueDate);
    const timezone = task.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    console.log('[RepeatCalculator] Last trigger:', lastTrigger.toISOString());
    console.log('[RepeatCalculator] Timezone:', timezone);
    console.log('[RepeatCalculator] Repeat type:', task.repeatType);
    
    let nextOccurrence: Date | null = null;
    
    switch (task.repeatType) {
        case 'DAILY':
            nextOccurrence = calculateNextDaily(lastTrigger, task.repeatConfig as DailyRepeatConfig, timezone);
            break;
        case 'WEEKLY':
            nextOccurrence = calculateNextWeekly(lastTrigger, task.repeatConfig as WeeklyRepeatConfig, timezone);
            break;
        case 'MONTHLY':
            nextOccurrence = calculateNextMonthly(lastTrigger, task.repeatConfig as MonthlyRepeatConfig, timezone);
            break;
        case 'CUSTOM':
            console.warn('[RepeatCalculator] CUSTOM repeat not yet implemented');
            return null;
        default:
            console.warn('[RepeatCalculator] Unknown repeat type:', task.repeatType);
            return null;
    }
    
    if (nextOccurrence) {
        const isoString = nextOccurrence.toISOString();
        console.log('[RepeatCalculator] Next occurrence:', isoString);
        return isoString;
    }
    
    return null;
}

/**
 * Calculate next occurrence for DAILY repeat
 * Adds intervalDays to the last trigger
 */
function calculateNextDaily(
    lastTrigger: Date,
    config: DailyRepeatConfig,
    timezone: string
): Date {
    console.log('[RepeatCalculator] Daily repeat, interval:', config.intervalDays, 'days');
    
    // Create new date from last trigger
    const next = new Date(lastTrigger);
    
    // Add interval days
    next.setDate(next.getDate() + config.intervalDays);
    
    console.log('[RepeatCalculator] Daily next:', next.toISOString());
    return next;
}

/**
 * Calculate next occurrence for WEEKLY repeat
 * Finds the next occurrence on specified days of week
 */
function calculateNextWeekly(
    lastTrigger: Date,
    config: WeeklyRepeatConfig,
    timezone: string
): Date {
    console.log('[RepeatCalculator] Weekly repeat, days:', config.daysOfWeek, 'interval:', config.intervalWeeks);
    
    // Day name to number mapping (0 = Sunday, 6 = Saturday)
    const dayMap: { [key: string]: number } = {
        'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3,
        'THU': 4, 'FRI': 5, 'SAT': 6
    };
    
    // Convert day names to numbers and sort
    const targetDays = config.daysOfWeek
        .map(day => dayMap[day])
        .filter(day => day !== undefined)
        .sort((a, b) => a - b);
    
    if (targetDays.length === 0) {
        console.warn('[RepeatCalculator] No valid days specified, defaulting to +7 days');
        const next = new Date(lastTrigger);
        next.setDate(next.getDate() + 7);
        return next;
    }
    
    const currentDay = lastTrigger.getDay();
    console.log('[RepeatCalculator] Current day:', currentDay, 'Target days:', targetDays);
    
    // Find next occurrence
    let daysToAdd = 0;
    let found = false;
    
    // First, check if there's a target day later in the same week
    for (const targetDay of targetDays) {
        if (targetDay > currentDay) {
            daysToAdd = targetDay - currentDay;
            found = true;
            break;
        }
    }
    
    // If not found in current week, go to first day of next interval
    if (!found) {
        const daysUntilNextWeek = 7 - currentDay + targetDays[0];
        daysToAdd = daysUntilNextWeek + (7 * (config.intervalWeeks - 1));
    }
    
    const next = new Date(lastTrigger);
    next.setDate(next.getDate() + daysToAdd);
    
    console.log('[RepeatCalculator] Weekly next:', next.toISOString(), 'days added:', daysToAdd);
    return next;
}

/**
 * Calculate next occurrence for MONTHLY repeat
 * Adds intervalMonths and sets to specified day of month
 */
function calculateNextMonthly(
    lastTrigger: Date,
    config: MonthlyRepeatConfig,
    timezone: string
): Date {
    console.log('[RepeatCalculator] Monthly repeat, day:', config.dayOfMonth, 'interval:', config.intervalMonths);
    
    const next = new Date(lastTrigger);
    
    // Add interval months
    next.setMonth(next.getMonth() + config.intervalMonths);
    
    // Set to target day of month
    // Handle case where day doesn't exist in month (e.g., Feb 31)
    const targetDay = config.dayOfMonth;
    const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    
    if (targetDay > daysInMonth) {
        console.warn('[RepeatCalculator] Day', targetDay, 'does not exist in month, using last day:', daysInMonth);
        next.setDate(daysInMonth);
    } else {
        next.setDate(targetDay);
    }
    
    console.log('[RepeatCalculator] Monthly next:', next.toISOString());
    return next;
}

/**
 * Helper: Get day name from Date
 */
export function getDayName(date: Date): string {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[date.getDay()];
}

/**
 * Helper: Format repeat config for display
 */
export function formatRepeatConfig(task: Task): string {
    if (!task.repeatType || task.repeatType === 'NONE') {
        return 'Does not repeat';
    }
    
    if (!task.repeatConfig) {
        return 'Invalid repeat configuration';
    }
    
    switch (task.repeatType) {
        case 'DAILY': {
            const config = task.repeatConfig as DailyRepeatConfig;
            return config.intervalDays === 1 
                ? 'Daily' 
                : `Every ${config.intervalDays} days`;
        }
        case 'WEEKLY': {
            const config = task.repeatConfig as WeeklyRepeatConfig;
            const days = config.daysOfWeek.join(', ');
            return config.intervalWeeks === 1
                ? `Weekly on ${days}`
                : `Every ${config.intervalWeeks} weeks on ${days}`;
        }
        case 'MONTHLY': {
            const config = task.repeatConfig as MonthlyRepeatConfig;
            return config.intervalMonths === 1
                ? `Monthly on day ${config.dayOfMonth}`
                : `Every ${config.intervalMonths} months on day ${config.dayOfMonth}`;
        }
        case 'CUSTOM':
            return 'Custom repeat';
        default:
            return 'Unknown repeat';
    }
}
