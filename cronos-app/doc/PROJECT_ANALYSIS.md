# Cronos App - Complete Project Analysis

**Generated on:** January 31, 2026  
**Project Type:** React Native/Expo Task Management Application  
**Version:** 1.0.0

---

## 1. DETECTED TECH STACK

### Core Framework & Runtime
- **React Native**: 0.81.5 - Cross-platform mobile framework
- **Expo**: ~54.0.32 - Development platform and build system
- **React**: 19.1.0 - UI library with latest features
- **TypeScript**: ~5.9.2 - Type safety and developer experience
- **Node.js**: Runtime environment

### Navigation & Routing
- **Expo Router**: ~6.0.22 - File-based routing system (Next.js-style)
- **React Navigation**: 7.x ecosystem
  - `@react-navigation/bottom-tabs`: Tab navigation
  - `@react-navigation/native`: Core navigation primitives
  - `@react-navigation/elements`: Navigation UI components

### State Management & Storage
- **Zustand**: ^5.0.10 - Lightweight state management library
- **React Native MMKV**: ^4.1.1 - High-performance C++ based local storage
- **Zustand Persist Middleware**: State hydration and persistence

### Backend & Authentication
- **Supabase**: ^2.93.3 - PostgreSQL backend with real-time capabilities
  - Authentication (email/password)
  - Real-time subscriptions
  - Row-level security
- **Expo Secure Store**: ^15.0.8 - Encrypted credential storage

### UI & Styling
- **NativeWind**: ^4.2.1 - Tailwind CSS for React Native
- **Tailwind CSS**: ^3.4.19 - Utility-first CSS framework
- **Tailwind Merge**: ^3.4.0 - Intelligent class merging
- **Lucide React Native**: ^0.563.0 - Modern icon library
- **Clsx**: ^2.1.1 - Conditional class name utility

### Notifications & Device Features
- **Expo Notifications**: ~0.32.16 - Push notifications with actions
- **Expo Device**: ~8.0.10 - Device information and capabilities
- **Expo Haptics**: ~15.0.8 - Haptic feedback

### Date & Time Management
- **Date-fns**: ^4.1.0 - Modern date manipulation library
- **React Native Community DateTimePicker**: 8.4.4 - Native date/time picker

### Animations & Interactions
- **React Native Reanimated**: ~4.1.1 - High-performance animations
- **React Native Gesture Handler**: ~2.28.0 - Native gesture recognition
- **React Native Worklets**: 0.5.1 - JavaScript worklets for animations

### Platform Support & Utilities
- **React Native Web**: ~0.21.0 - Web platform support
- **React Native Safe Area Context**: ~5.6.0 - Safe area handling
- **React Native Screens**: ~4.16.0 - Native screen management
- **React Native SVG**: SVG support
- **React Native URL Polyfill**: ^3.0.0 - URL polyfill for React Native
- **React Native Get Random Values**: ^2.0.0 - Crypto polyfill
- **UUID**: ^13.0.0 - UUID generation

### Development Tools
- **ESLint**: ^9.25.0 - Code linting with Expo config
- **Babel**: Transpilation with React Compiler support
- **Metro**: React Native bundler with NativeWind integration
- **TypeScript**: Strict mode enabled with path aliases

---

## 2. HIGH-LEVEL ARCHITECTURE

### Architectural Pattern: **Offline-First with Real-time Sync**

```
┌─────────────────────────────────────────────────────────────┐
│                    CRONOS APP ARCHITECTURE                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Auth Screen │  │ Home Screen  │  │ Task Modals      │   │
│  │ (auth.tsx)  │  │ (index.tsx)  │  │ (Add/Edit)       │   │
│  └──────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    ┌─────▼──────┐                            │
│                    │ Components │                            │
│                    │ (TaskItem) │                            │
│                    └─────┬──────┘                            │
└─────────────────────────┼────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  STATE MANAGEMENT LAYER                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Zustand Store (useTaskStore.ts)                      │   │
│  │ • tasks: Task[]                                      │   │
│  │ • isSyncing: boolean                                 │   │
│  │ • lastSyncAt: string                                 │   │
│  │ • Actions: CRUD operations + sync management        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ MMKV Storage (storage.ts)                           │   │
│  │ • High-performance C++ storage                      │   │
│  │ • Encrypted persistence                             │   │
│  │ • Survives app restarts                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ SyncService (SyncService.ts)                         │   │
│  │ • pushChanges(): Upload local changes               │   │
│  │ • pullChanges(): Download remote changes            │   │
│  │ • syncAll(): Full bidirectional sync                │   │
│  │ • subscribeToTasks(): Real-time listener            │   │
│  │ • Conflict resolution (remote wins)                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ NotificationManager (NotificationManager.ts)        │   │
│  │ • scheduleTaskNotification(): Schedule reminders    │   │
│  │ • cancelTaskNotification(): Cancel reminders        │   │
│  │ • rescheduleNotifications(): Batch operations       │   │
│  │ • Action handling (snooze, complete)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ useNotificationObserver (useNotificationObserver.ts)│   │
│  │ • Listen for notification responses                 │   │
│  │ • Handle user actions (snooze/complete)             │   │
│  │ • Trigger sync after actions                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Supabase Client (supabase.ts)                        │   │
│  │ • Authentication with secure storage                │   │
│  │ • Real-time subscriptions                           │   │
│  │ • Database operations (CRUD)                        │   │
│  │ • Session management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │ Supabase Backend (PostgreSQL + Real-time)           │   │
│  │ • tasks table with RLS policies                     │   │
│  │ • auth.users table (managed by Supabase)            │   │
│  │ • Real-time: postgres_changes subscriptions         │   │
│  │ • Row-level security (user_id filtering)            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Offline-First**: App works fully offline with local MMKV storage
2. **Real-time Sync**: Bidirectional synchronization with conflict resolution
3. **Local-First**: UI updates immediately, sync happens in background
4. **Event-Driven**: Notification actions trigger state changes and sync
5. **Modular Design**: Clear separation of concerns across layers
6. **Type Safety**: Full TypeScript coverage with strict mode

---

## 3. MAIN MODULES AND THEIR RESPONSIBILITIES

### 3.1 Authentication Module
**Files**: `app/_layout.tsx`, `app/auth.tsx`, `lib/supabase.ts`

**Responsibilities**:
- User authentication (email/password via Supabase)
- Session management and persistence
- Secure token storage using Expo Secure Store
- Auth state monitoring with automatic routing
- Sign-up and sign-in flows

**Key Features**:
- Automatic session recovery on app restart
- Secure credential storage (encrypted)
- Auth state listener with route protection
- Loading states during authentication checks

### 3.2 Task Management Core
**Files**: `core/store/useTaskStore.ts`, `core/store/storage.ts`

**Responsibilities**:
- Centralized task state management using Zustand
- High-performance local persistence via MMKV
- Task CRUD operations with optimistic updates
- Sync status tracking (isSynced flags)
- State hydration and dehydration

**Task Data Model**:
```typescript
interface Task {
  id: string;              // UUID v4
  user_id?: string;        // Supabase user ID
  title: string;           // Task description
  dueDate?: string;        // ISO date string
  status: "pending" | "snoozed" | "completed";
  createdAt: string;       // ISO timestamp
  updatedAt?: string;      // ISO timestamp
  isSynced?: boolean;      // Local sync flag
}
```

**Store Actions**:
- `addTask()` - Create with UUID generation
- `updateTask()` - Modify task details
- `toggleTaskStatus()` - Complete/pending toggle
- `snoozeTask()` - Delay by specified minutes
- `deleteTask()` - Remove task
- `markTaskSynced()` - Mark as synchronized
- `upsertTaskFromRemote()` - Merge remote changes
- `getUnsyncedTasks()` - Get pending sync items

### 3.3 Synchronization Engine
**Files**: `services/SyncService.ts`

**Responsibilities**:
- Bidirectional sync with Supabase backend
- Conflict resolution (remote timestamp wins)
- Real-time subscription management
- Batch operations for efficiency
- Error handling and retry logic

**Sync Strategy**:
1. **Pull Phase**: Download remote changes first
   - Fetch all user tasks from Supabase
   - Upsert new/updated tasks (remote wins conflicts)
   - Detect and remove locally deleted tasks
   - Schedule notifications for new tasks

2. **Push Phase**: Upload local changes
   - Get all unsynced local tasks
   - Upsert each to Supabase with error handling
   - Mark successfully synced tasks
   - Track and report errors

3. **Real-time Subscription**:
   - Listen for `postgres_changes` events
   - Debounce rapid updates (500ms)
   - Prevent self-triggered syncs (3s cooldown)
   - Trigger full sync on remote changes

**Database Schema** (Supabase):
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  local_id UUID,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  due_date TIMESTAMP,
  status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3.4 Notification System
**Files**: `core/notifications/NotificationManager.ts`, `core/notifications/useNotificationObserver.ts`

**Responsibilities**:
- Push notification scheduling and management
- Permission handling across platforms
- Notification action processing
- Batch notification operations
- Integration with task lifecycle

**Notification Features**:
- **Scheduling**: Time-based triggers using due dates
- **Actions**: Snooze (22 minutes), Complete, Default (open app)
- **Permissions**: Platform-specific permission requests
- **Channels**: Android notification channels
- **Batch Operations**: Reschedule multiple notifications efficiently

**Notification Flow**:
```
Task Created/Updated → Calculate Trigger Time → Schedule Notification
                                                        ↓
User Receives Alert ← Notification Fires ← System Triggers
        ↓
User Taps Action → useNotificationObserver → Update Store → Sync
```

### 3.5 User Interface Layer
**Files**: `app/index.tsx`, `components/ui/TaskItem.tsx`, `components/AddTaskModal.tsx`, `components/EditTaskModal.tsx`

**Responsibilities**:
- Task list display with smart sectioning
- Task creation and editing interfaces
- Real-time UI updates
- Pull-to-refresh functionality
- Responsive design across platforms

**UI Components**:

#### Home Screen (`app/index.tsx`)
- **Sectioned List**: Overdue, Today, Upcoming, No Date
- **Sync Status**: Visual indicator with refresh capability
- **Pull-to-Refresh**: Manual sync trigger
- **Add Button**: Floating action button
- **Sign Out**: User session management

#### TaskItem (`components/ui/TaskItem.tsx`)
- **Status Toggle**: Complete/pending with haptic feedback
- **Edit Trigger**: Tap to edit task details
- **Delete Action**: Swipe or tap to remove
- **Due Date Display**: Formatted date/time
- **Animations**: Smooth entry/exit transitions

#### Task Modals (`components/AddTaskModal.tsx`, `components/EditTaskModal.tsx`)
- **Text Input**: Auto-focus with keyboard handling
- **Date Picker**: Platform-specific (iOS/Android)
- **Validation**: Title required, date optional
- **Immediate Sync**: Background sync after creation/edit

### 3.6 Platform Integration
**Files**: `app.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`

**Responsibilities**:
- Cross-platform build configuration
- Native feature integration
- Styling system setup
- Development tooling

**Platform Features**:
- **iOS**: Safe area handling, haptic feedback, native date picker
- **Android**: Edge-to-edge UI, notification channels, exact alarms
- **Web**: Static output, responsive design, React Native Web

### 3.7 Utility Layer
**Files**: `lib/utils.ts`, `core/constants.ts`, `hooks/`

**Responsibilities**:
- Shared utility functions
- Configuration constants
- Custom React hooks
- Type definitions

**Key Utilities**:
- `cn()` - Tailwind class merging utility
- Color scheme detection hooks
- Theme color resolution
- Supabase configuration constants

---

## 4. PROJECT STRUCTURE ANALYSIS

```
cronos-app/
├── 📱 app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx                  # Root layout with auth management
│   ├── index.tsx                    # Home screen (main task list)
│   └── auth.tsx                     # Authentication screen
│
├── 🧩 components/                   # Reusable UI components
│   ├── AddTaskModal.tsx             # Task creation modal
│   ├── EditTaskModal.tsx            # Task editing modal
│   ├── [themed-components]          # Theme-aware base components
│   └── ui/
│       ├── TaskItem.tsx             # Individual task display
│       └── [ui-primitives]          # Base UI components
│
├── 🏗️ core/                         # Core business logic
│   ├── constants.ts                 # Supabase configuration
│   ├── notifications/               # Push notification system
│   │   ├── NotificationManager.ts   # Notification scheduling
│   │   └── useNotificationObserver.ts # Notification listener
│   └── store/                       # State management
│       ├── useTaskStore.ts          # Zustand task store
│       └── storage.ts               # MMKV storage adapter
│
├── 🔄 services/                     # Business logic services
│   └── SyncService.ts               # Supabase synchronization
│
├── 🛠️ lib/                          # Utilities and configuration
│   ├── supabase.ts                  # Supabase client setup
│   └── utils.ts                     # Helper functions
│
├── 🎣 hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts          # Color scheme detection
│   ├── use-theme-color.ts           # Theme color resolution
│   └── use-color-scheme.web.ts      # Web-specific color scheme
│
├── 🎨 constants/                    # App constants
│   └── theme.ts                     # Color and font definitions
│
├── 📦 assets/                       # Static assets
│   ├── images/                      # Icons, splash screens
│   └── fonts/                       # Custom fonts
│
├── 🤖 android/                      # Android native code
│   ├── app/                         # Android app module
│   └── [gradle-config]              # Build configuration
│
├── 🍎 ios/                          # iOS native code
│   ├── cronosapp/                   # iOS app module
│   ├── cronosapp.xcodeproj/         # Xcode project
│   └── Podfile                      # CocoaPods dependencies
│
├── ⚙️ Configuration Files
│   ├── package.json                 # Dependencies and scripts
│   ├── app.json                     # Expo configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tailwind.config.js           # Tailwind CSS setup
│   ├── babel.config.js              # Babel transpilation
│   ├── metro.config.js              # Metro bundler setup
│   ├── eslint.config.js             # ESLint configuration
│   ├── global.css                   # Global Tailwind styles
│   └── nativewind-env.d.ts          # NativeWind type definitions
```

---

## 5. DATA FLOW EXAMPLES

### 5.1 Task Creation Flow
```
1. User taps + button
2. AddTaskModal opens with auto-focus
3. User enters title and selects due date
4. User taps "Create" button
5. addTask() generates UUID and creates task locally
6. Task added to Zustand store (isSynced: false)
7. Task persisted to MMKV storage
8. scheduleTaskNotification() called for due date
9. Notification scheduled with Expo Notifications
10. syncAll() triggered in background
11. pushChanges() uploads task to Supabase
12. Task marked as synced (isSynced: true)
13. Supabase real-time notifies other devices
14. Other devices pull changes via subscribeToTasks()
15. Other devices schedule notifications locally
```

### 5.2 Task Completion Flow
```
1. User taps task checkbox
2. toggleTaskStatus() called with haptic feedback
3. Task status changed to "completed"
4. Task marked as unsynced (isSynced: false)
5. MMKV storage updated
6. UI re-renders with fade animation
7. syncAll() called in background
8. pushChanges() uploads status change
9. Supabase database updated
10. Real-time subscription notifies other devices
11. Other devices pull and update task status
12. Completed task moves to bottom/hidden
```

### 5.3 Notification Action Flow (Snooze)
```
1. Notification fires at scheduled due time
2. User sees alert with action buttons
3. User taps "Snooze 22m" button
4. useNotificationObserver receives response
5. snoozeTask() called (adds 22 minutes to due date)
6. Task status changed to "snoozed"
7. New notification scheduled for updated time
8. Task marked as unsynced
9. syncAll() called to push changes
10. Supabase updated with new due date
11. Real-time notifies other devices
12. Other devices pull and reschedule notifications
```

### 5.4 Real-time Sync Flow
```
1. Device A creates/updates a task
2. Task synced to Supabase via pushChanges()
3. Supabase triggers postgres_changes event
4. Device B receives real-time notification
5. subscribeToTasks() callback triggered
6. Debounced sync (500ms) prevents rapid updates
7. pullChanges() fetches latest data
8. New/updated tasks upserted to local store
9. Notifications rescheduled for new tasks
10. UI updates with new data
11. MMKV storage updated
```

---

## 6. CONFIGURATION ANALYSIS

### 6.1 Expo Configuration (`app.json`)
```json
{
  "expo": {
    "name": "cronos-app",
    "version": "1.0.0",
    "newArchEnabled": true,
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    },
    "plugins": [
      "expo-router",
      "expo-splash-screen",
      "@react-native-community/datetimepicker",
      "expo-notifications",
      "expo-secure-store"
    ]
  }
}
```

**Key Features**:
- New React Native Architecture enabled
- Typed routes for better developer experience
- React Compiler for performance optimization
- Comprehensive plugin configuration

### 6.2 TypeScript Configuration (`tsconfig.json`)
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Features**:
- Strict mode enabled for type safety
- Path aliases for cleaner imports
- Expo base configuration

### 6.3 Styling Configuration
**Tailwind** (`tailwind.config.js`):
```javascript
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: []
}
```

**Metro** (`metro.config.js`):
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

**Babel** (`babel.config.js`):
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }]],
    plugins: ["react-native-reanimated/plugin"]
  };
};
```

---

## 7. SECURITY & PERFORMANCE CONSIDERATIONS

### Security Features
1. **Authentication**: Supabase Auth with secure token storage
2. **Encryption**: Expo Secure Store for sensitive credentials
3. **HTTPS**: All Supabase communication encrypted
4. **Row-Level Security**: Database policies filter by user_id
5. **Permissions**: Explicit notification permissions
6. **UUID Validation**: Prevents legacy task issues

### Performance Optimizations
1. **MMKV Storage**: C++ based, faster than AsyncStorage
2. **Zustand**: Minimal re-renders with selective subscriptions
3. **Real-time Debounce**: 500ms prevents excessive syncs
4. **Self-Trigger Prevention**: 3s cooldown prevents sync loops
5. **React Compiler**: Automatic component optimization
6. **Reanimated**: Native thread animations
7. **Code Splitting**: Expo Router lazy loading

---

## 8. DEVELOPMENT WORKFLOW

### Available Scripts
```bash
npm start              # Start Expo dev server
npm run android        # Build and run on Android
npm run ios           # Build and run on iOS  
npm run web           # Run web version
npm run lint          # Run ESLint
npm run reset-project # Reset to blank project
```

### Build Process
1. **Metro Bundler**: JavaScript bundling
2. **Babel**: TypeScript/JSX transpilation with NativeWind
3. **React Compiler**: Component optimization
4. **NativeWind**: Tailwind to React Native style conversion
5. **Platform-Specific**: Separate iOS/Android/Web builds

---

## 9. SUMMARY

**Cronos** is a production-ready task management application featuring:

✅ **Modern Stack**: React Native 0.81, Expo 54, React 19  
✅ **Type Safety**: Full TypeScript with strict mode  
✅ **State Management**: Zustand with MMKV persistence  
✅ **Real-time Sync**: Supabase with conflict resolution  
✅ **Push Notifications**: Actionable reminders with snooze/complete  
✅ **Offline-First**: Works without internet, syncs when available  
✅ **Cross-Platform**: iOS, Android, and Web support  
✅ **Modern UI**: Tailwind CSS via NativeWind  
✅ **Smooth Animations**: React Native Reanimated  
✅ **Security**: Encrypted storage and secure authentication  
✅ **Performance**: Optimized with React Compiler and native storage  

The architecture follows modern React Native best practices with clear separation of concerns, robust error handling, and excellent developer experience. The offline-first approach ensures reliability while real-time sync provides seamless multi-device experiences.

---

**Analysis Complete** - Project successfully indexed and documented.