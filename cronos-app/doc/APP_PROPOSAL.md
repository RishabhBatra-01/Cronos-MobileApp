# Cronos — App Proposal

## The Problem

Productivity tools are everywhere. There are hundreds of to-do apps on the App Store, and yet people still forget tasks, miss deadlines, and feel overwhelmed by their own lists. The reason is simple: **traditional task managers create more work, not less.**

Every existing solution follows the same formula — open the app, tap "new task," type a title, pick a date from a calendar widget, select a priority, save. Repeat fifty times a week. For busy professionals, parents, and students juggling multiple responsibilities, the friction of *entering* tasks is often enough to abandon the habit entirely. And once the task is in, you're on your own — the app stores it, but never helps you figure out *how* to actually do it.

There's a gap in the market for a task manager that removes input friction entirely and actively assists with execution — one that works at the speed of thought, not the speed of typing.

---

## The Solution

**Cronos** is an AI-native task management app for iOS and Android that fundamentally rethinks how people capture, organize, and accomplish their tasks.

### Voice-First Input
Users speak naturally — "submit the tax docs by Friday, remind me to call mom every Sunday, and book a dentist appointment next Thursday afternoon" — and Cronos creates three separate, fully structured tasks with correct dates, priorities, and repeat schedules. Powered by OpenAI Whisper for transcription and GPT-4o-mini for natural language parsing, it eliminates the typing-and-tapping bottleneck completely.

### AI-Powered Task Intelligence
Every task in Cronos has access to an AI assistant powered by Perplexity Sonar:
- **Deep Research** — real-time web research with cited sources, structured into actionable overviews, checklists, and resources
- **Sub-Task Generation** — AI breaks large goals into bite-sized steps that get added to your list
- **Conversational Chat** — multi-turn dialogue about any task with full context awareness

### Cross-Device Sync & Smart Notifications
Tasks sync in real-time across iOS and Android via Supabase Realtime. Notifications are actionable — snooze for 5, 10, or 30 minutes, or mark complete directly from the lock screen. Repeating tasks auto-regenerate on completion. Pre-notification reminders ("remind me 1 hour before") ensure nothing slips through.

---

## Target Audience

### Primary: Busy Professionals (Ages 25–45)
Knowledge workers, freelancers, and managers who juggle work deliverables, personal errands, and side projects. They've tried Todoist, Notion, and Apple Reminders but find them too manual or too complex. They want something that captures tasks in the moment — during commutes, meetings, or while multitasking — without breaking their flow.

### Secondary: Students & Academics (Ages 18–28)
University students managing coursework, deadlines, group projects, and personal life. The AI research feature is particularly valuable — they can create a task like "Study for distributed systems midterm" and get an instant research brief with key concepts, study checklists, and recommended resources.

### Tertiary: Productivity Enthusiasts & Early Adopters
Tech-forward users who actively seek AI-powered tools and are willing to pay for premium features. They value the innovation of voice-first input and AI sub-task generation, and are likely to become evangelists within their networks.

---

## Monetization Strategy

Cronos follows a **freemium model** with a clear value ladder:

### Free Tier
- Unlimited task creation (manual input)
- Basic notifications and reminders
- Repeat scheduling (daily, weekly, monthly)
- Priority levels and active/inactive toggling

### Cronos Pro (Subscription — $4.99/month or $39.99/year)
- **Voice Input** — unlimited voice-to-task creation with AI parsing
- **AI Assistant** — deep research, sub-task generation, and conversational chat on any task
- **Cross-Device Sync** — real-time sync across all devices
- **Advanced Notifications** — snooze actions, pre-notifications, and lock-screen controls

### Why This Works
The free tier is genuinely useful — users build a habit and populate their task list. The premium tier unlocks the *magic* — voice input and AI intelligence — which is where the "aha moment" lives. Users experience the free version, understand the value, and upgrade when they realize how much faster the AI-powered workflow is.

Subscription billing is managed through **RevenueCat**, with a custom-built paywall featuring a swipe-to-pay gesture and polished premium UI. This ensures a seamless upgrade experience on both iOS and Android.

---

## Market Opportunity

The global productivity app market is valued at over **$90 billion** and growing. Yet no major player has built an AI-first mobile task manager. Todoist, TickTick, and Microsoft To Do all bolt AI on as an afterthought. Cronos is designed from the ground up around AI — voice input isn't a feature, it's the primary interface. AI research isn't a gimmick, it's built into every task.

The timing is right: users are increasingly comfortable talking to AI (thanks to ChatGPT, Siri, and Alexa), and the infrastructure to build AI-native apps (OpenAI APIs, Perplexity, Supabase) has matured enough to deliver fast, reliable experiences on mobile.

Cronos isn't competing with to-do apps. It's building the next category: **the AI productivity partner.**

---

## Vision

Cronos today is a smart task manager. Cronos tomorrow is a **personal AI operating system** — one that connects to your email, calendar, Slack, and tools through the Model Context Protocol (MCP), proactively creates tasks from your life, and eventually executes them on your behalf. The task list is just the starting point.
