import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { zustandStorage } from "./storage";
// Must import before uuid to provide crypto.getRandomValues polyfill
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { calculateNextOccurrence } from '../scheduling/RepeatCalculator';

export type TaskStatus = "pending" | "snoozed" | "completed";
export type TaskPriority = "low" | "medium" | "high";

// NEW: Phase 2 - Repeat Types
export type RepeatType = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface DailyRepeatConfig {
    intervalDays: number; // e.g., 1 = every day, 2 = every 2 days
}

export interface WeeklyRepeatConfig {
    daysOfWeek: string[]; // ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    intervalWeeks: number; // e.g., 1 = every week, 2 = every 2 weeks
}

export interface MonthlyRepeatConfig {
    dayOfMonth: number; // 1-31
    intervalMonths: number; // e.g., 1 = every month, 3 = every 3 months
}

export type RepeatConfig = 
    | DailyRepeatConfig 
    | WeeklyRepeatConfig 
    | MonthlyRepeatConfig 
    | null;

export interface Task {
    id: string;
    user_id?: string;
    title: string;
    dueDate?: string; // ISO string (legacy, keep for backward compatibility)
    
    // Phase 1: Scheduling fields
    scheduledDate?: string;  // "YYYY-MM-DD"
    scheduledTime?: string;  // "HH:mm"
    timezone?: string;       // IANA timezone (e.g., "America/Los_Angeles")
    isActive: boolean;       // Default: true (controls whether task participates in scheduling)
    
    // Phase 2: Repeat fields
    repeatType?: RepeatType;        // Type of repeat (NONE, DAILY, WEEKLY, MONTHLY, CUSTOM)
    repeatConfig?: RepeatConfig;    // Configuration for the repeat type
    lastCompletedAt?: string;       // ISO timestamp of last completion
    nextOccurrence?: string;        // ISO timestamp of next scheduled occurrence
    
    // Phase 3: Notify Before
    preNotifyOffsets?: string[];    // ISO 8601 duration offsets (e.g., ["PT5M", "PT1H"])
    
    // Phase 4: Snooze
    snoozeEnabled?: boolean;        // Whether snooze is enabled for this task
    snoozeDuration?: string;        // ISO 8601 duration (PT5M, PT10M, PT30M, PT1H)
    snoozedUntil?: string;          // ISO timestamp when snoozed notification should fire
    snoozeCount?: number;           // Track how many times snoozed
    
    priority?: TaskPriority; // Optional, defaults to 'medium'
    description?: string; // Optional notes/details
    status: TaskStatus;
    createdAt: string;
    updatedAt?: string;
    isSynced?: boolean;
}

interface TaskState {
    tasks: Task[];
    isSyncing: boolean;
    lastSyncAt?: string;
    addTask: (title: string, dueDate?: string, priority?: TaskPriority, description?: string, repeatType?: RepeatType, repeatConfig?: RepeatConfig, preNotifyOffsets?: string[], snoozeEnabled?: boolean, snoozeDuration?: string) => string;
    updateTask: (id: string, title: string, dueDate?: string, priority?: TaskPriority, description?: string, repeatType?: RepeatType, repeatConfig?: RepeatConfig, preNotifyOffsets?: string[], snoozeEnabled?: boolean, snoozeDuration?: string) => void;
    toggleTaskStatus: (id: string) => void;
    toggleTaskActive: (id: string) => void;
    snoozeTask: (id: string) => void;  // Phase 4: Updated signature (no duration param)
    deleteTask: (id: string) => void;
    // Sync actions
    setIsSyncing: (syncing: boolean) => void;
    setLastSyncAt: (timestamp: string) => void;
    markTaskSynced: (id: string) => void;
    upsertTaskFromRemote: (task: Task) => void;
    setUserIdForTasks: (userId: string) => void;
    getUnsyncedTasks: () => Task[];
    clearAllTasks: () => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: [],
            isSyncing: false,
            lastSyncAt: undefined,

            addTask: (title: string, dueDate?: string, priority: TaskPriority = 'medium', description?: string, repeatType: RepeatType = 'NONE', repeatConfig: RepeatConfig = null, preNotifyOffsets: string[] = [], snoozeEnabled: boolean = false, snoozeDuration?: string) => {
                // Validate and sanitize title
                const sanitizedTitle = typeof title === 'string' ? title : String(title || '');
                if (!sanitizedTitle.trim()) {
                    console.error('[TaskStore] Cannot add task with empty title');
                    return '';
                }
                
                // Validate and sanitize description
                const sanitizedDescription = description 
                    ? (typeof description === 'string' ? description : String(description))
                    : undefined;
                
                const id = uuidv4();  // Generate proper UUID
                const now = new Date().toISOString();
                set((state) => ({
                    tasks: [
                        ...state.tasks,
                        {
                            id,
                            title: sanitizedTitle,
                            dueDate,
                            priority,
                            description: sanitizedDescription,
                            isActive: true, // NEW: Default to active
                            repeatType,        // Phase 2: Repeat type
                            repeatConfig,      // Phase 2: Repeat configuration
                            preNotifyOffsets,  // Phase 3: Notify before offsets
                            snoozeEnabled,     // Phase 4: Snooze enabled
                            snoozeDuration,    // Phase 4: Snooze duration
                            status: "pending",
                            createdAt: now,
                            updatedAt: now,
                            isSynced: false,
                        },
                    ],
                }));
                return id;
            },

            updateTask: (id: string, title: string, dueDate?: string, priority?: TaskPriority, description?: string, repeatType?: RepeatType, repeatConfig?: RepeatConfig, preNotifyOffsets?: string[], snoozeEnabled?: boolean, snoozeDuration?: string) => {
                // Validate and sanitize title
                const sanitizedTitle = typeof title === 'string' ? title : String(title || '');
                
                // Validate and sanitize description
                // IMPORTANT: undefined means "provided as empty/cleared", so we should update it
                // If we want to keep old value, the caller should pass the old value explicitly
                const sanitizedDescription = description !== undefined
                    ? (typeof description === 'string' ? description : String(description))
                    : undefined;
                
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id
                            ? {
                                ...task,
                                title: sanitizedTitle,
                                dueDate,
                                priority: priority !== undefined ? priority : task.priority,
                                description: sanitizedDescription, // Always update description when provided (even if empty)
                                repeatType: repeatType !== undefined ? repeatType : task.repeatType,      // Phase 2
                                repeatConfig: repeatConfig !== undefined ? repeatConfig : task.repeatConfig, // Phase 2
                                preNotifyOffsets: preNotifyOffsets !== undefined ? preNotifyOffsets : task.preNotifyOffsets, // Phase 3
                                snoozeEnabled: snoozeEnabled !== undefined ? snoozeEnabled : task.snoozeEnabled, // Phase 4
                                snoozeDuration: snoozeDuration !== undefined ? snoozeDuration : task.snoozeDuration, // Phase 4
                                updatedAt: new Date().toISOString(),
                                isSynced: false,
                            }
                            : task
                    ),
                }));
            },

            toggleTaskStatus: (id: string) =>
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    if (!task) return state;

                    const newStatus = task.status === "completed" ? "pending" : "completed";
                    
                    // NEW: Phase 2 - Handle repeating tasks
                    if (newStatus === "completed" && task.isActive && task.repeatType && task.repeatType !== 'NONE') {
                        console.log('[TaskStore] Completing repeating task, calculating next occurrence');
                        
                        // Calculate next occurrence
                        const nextOccurrence = calculateNextOccurrence(task);
                        
                        if (nextOccurrence) {
                            console.log('[TaskStore] Next occurrence:', nextOccurrence);
                            
                            // Update task with next occurrence (keeps same task, updates due date)
                            return {
                                tasks: state.tasks.map((t) =>
                                    t.id === id
                                        ? {
                                            ...t,
                                            status: "pending", // Reset to pending for next occurrence
                                            dueDate: nextOccurrence,
                                            lastCompletedAt: new Date().toISOString(),
                                            nextOccurrence: nextOccurrence,
                                            updatedAt: new Date().toISOString(),
                                            isSynced: false,
                                        }
                                        : t
                                ),
                            };
                        } else {
                            console.log('[TaskStore] No next occurrence, marking as completed');
                        }
                    }
                    
                    // Normal toggle (non-repeating or no next occurrence)
                    return {
                        tasks: state.tasks.map((t) =>
                            t.id === id
                                ? {
                                    ...t,
                                    status: newStatus,
                                    lastCompletedAt: newStatus === "completed" ? new Date().toISOString() : t.lastCompletedAt,
                                    updatedAt: new Date().toISOString(),
                                    isSynced: false,
                                }
                                : t
                        ),
                    };
                }),

            toggleTaskActive: (id: string) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id
                            ? {
                                ...task,
                                isActive: !task.isActive,
                                updatedAt: new Date().toISOString(),
                                isSynced: false,
                            }
                            : task
                    ),
                })),

            snoozeTask: (id: string) =>
                set((state) => {
                    const task = state.tasks.find((t) => t.id === id);
                    
                    // Phase 4: Snooze validation (Master Spec Section 5.4)
                    if (!task) {
                        console.log('[TaskStore] Snooze: Task not found');
                        return state;
                    }
                    if (!task.snoozeEnabled) {
                        console.log('[TaskStore] Snooze: Not enabled for this task');
                        return state;
                    }
                    if (!task.isActive) {
                        console.log('[TaskStore] Snooze: Task is inactive');
                        return state;
                    }
                    if (!task.snoozeDuration) {
                        console.log('[TaskStore] Snooze: No duration configured');
                        return state;
                    }
                    
                    // Calculate snoozed time
                    const now = new Date();
                    const { parseDuration } = require('../scheduling/DurationUtils');
                    const durationMs = parseDuration(task.snoozeDuration);
                    const snoozedUntil = new Date(now.getTime() + durationMs);
                    
                    console.log('[TaskStore] Snoozing task until:', snoozedUntil.toISOString());
                    
                    // CRITICAL: Only update snooze fields, don't modify dueDate, repeat, etc.
                    return {
                        tasks: state.tasks.map((t) =>
                            t.id === id
                                ? {
                                    ...t,
                                    snoozedUntil: snoozedUntil.toISOString(),
                                    snoozeCount: (t.snoozeCount || 0) + 1,
                                    updatedAt: new Date().toISOString(),
                                    isSynced: false,
                                }
                                : t
                        ),
                    };
                }),

            deleteTask: (id: string) =>
                set((state) => ({
                    tasks: state.tasks.filter((task) => task.id !== id),
                })),

            // Sync actions
            setIsSyncing: (syncing: boolean) => set({ isSyncing: syncing }),

            setLastSyncAt: (timestamp: string) => set({ lastSyncAt: timestamp }),

            markTaskSynced: (id: string) =>
                set((state) => ({
                    tasks: state.tasks.map((task) =>
                        task.id === id ? { ...task, isSynced: true } : task
                    ),
                })),

            upsertTaskFromRemote: (remoteTask: Task) =>
                set((state) => {
                    const existingIndex = state.tasks.findIndex((t) => t.id === remoteTask.id);
                    if (existingIndex >= 0) {
                        // Update existing task (remote wins)
                        const updatedTasks = [...state.tasks];
                        updatedTasks[existingIndex] = { 
                            ...remoteTask, 
                            isActive: remoteTask.isActive ?? true, // Ensure isActive has default
                            isSynced: true 
                        };
                        return { tasks: updatedTasks };
                    } else {
                        // Add new task from remote
                        return { 
                            tasks: [...state.tasks, { 
                                ...remoteTask, 
                                isActive: remoteTask.isActive ?? true, // Ensure isActive has default
                                isSynced: true 
                            }] 
                        };
                    }
                }),

            setUserIdForTasks: (userId: string) =>
                set((state) => ({
                    tasks: state.tasks.map((task) => ({
                        ...task,
                        user_id: task.user_id || userId,
                    })),
                })),

            getUnsyncedTasks: () => get().tasks.filter((task) => !task.isSynced),

            clearAllTasks: () => set({ tasks: [], lastSyncAt: undefined }),
        }),
        {
            name: "cronos-task-store",
            storage: createJSONStorage(() => zustandStorage),
            // Migration to add isActive to existing tasks
            migrate: (persistedState: any, version: number) => {
                console.log('[TaskStore] Running migration, version:', version);
                
                if (persistedState && persistedState.tasks) {
                    // Sanitize and migrate tasks
                    persistedState.tasks = persistedState.tasks.map((task: any) => {
                        // Sanitize title (ensure it's a string)
                        const sanitizedTitle = typeof task.title === 'string' 
                            ? task.title 
                            : String(task.title || 'Untitled Task');
                        
                        // Sanitize description (ensure it's a string or undefined)
                        const sanitizedDescription = task.description !== undefined
                            ? (typeof task.description === 'string' ? task.description : String(task.description))
                            : undefined;
                        
                        return {
                            ...task,
                            title: sanitizedTitle,
                            description: sanitizedDescription,
                            isActive: task.isActive ?? true, // Default to true for existing tasks
                        };
                    }).filter((task: any) => task.title && task.title.trim() !== ''); // Remove tasks with empty titles
                    
                    console.log('[TaskStore] Migration complete, sanitized', persistedState.tasks.length, 'tasks');
                }
                
                return persistedState;
            },
        }
    )
);
