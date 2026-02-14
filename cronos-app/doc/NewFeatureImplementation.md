🧠 REMINDER TASK SCHEDULING — MASTER SPEC
(ACTIVE / INACTIVE TOGGLE + REPEAT + NOTIFY BEFORE + SNOOZE)

This document is the single source of truth for reminder scheduling behavior.
Do NOT infer behavior.
Do NOT invent defaults.
Do NOT modify unrelated functionality.
Implement exactly as specified.

0️⃣ Core Principles (Read First)

Active / Inactive controls whether a task participates in the system.

Repeat controls future occurrences.

Notify Before adds early notifications.

Snooze temporarily delays a currently triggered alert.

These features are independent, but must coordinate strictly.

1️⃣ BASE TASK MODEL (FOUNDATION)

Each task must contain:

{
  "scheduledDate": "YYYY-MM-DD",
  "scheduledTime": "HH:mm",
  "timezone": "IANA timezone",
  "isActive": true
}

Canonical Trigger Calculation

At creation time:

mainTrigger = ZonedDateTime(
  scheduledDate,
  scheduledTime,
  timezone
)


🚨 All scheduling must be derived from this value.
🚨 Device timezone must never be used.

2️⃣ 🔘 ACTIVE / INACTIVE TOGGLE (CONTROL PLANE)
2.1 Purpose

The Active / Inactive toggle allows the user to pause or resume a task without deleting it.

Active → task participates in scheduling

Inactive → task is fully paused

This is not deletion and not completion.

2.2 Data Model
"isActive": true | false


Default:

true on creation

2.3 Behavior When Active = true

When a task is active:

Main trigger is scheduled

Repeat logic runs (if configured)

Pre-notifications are scheduled

Snooze is allowed when triggered

2.4 Behavior When Active = false

When a task is inactive:

No triggers may fire

No future triggers may be scheduled

All pending triggers must be cancelled:

Main trigger

Pre-notifications

Snoozed triggers (if any)

Snooze must be disabled

Repeat logic must be paused

🚨 Inactive means complete silence.

2.5 Toggle ON → OFF (Deactivate)

When user deactivates a task:

Cancel all existing triggers

Do NOT modify:

scheduledDate

scheduledTime

timezone

repeat configuration

notify-before offsets

Persist isActive = false

2.6 Toggle OFF → ON (Reactivate)

When user reactivates a task:

Resume from the next valid future occurrence

Do NOT replay missed notifications

One-Time Task

If trigger is in the future → reschedule

If trigger is in the past → keep inactive or mark expired

Repeating Task

Compute next occurrence using repeat rules

Schedule main trigger and pre-notifications

3️⃣ 🔁 REPEAT — LONG-TERM SCHEDULING
3.1 Purpose

Repeat defines whether and how a task automatically schedules future occurrences after triggering.

3.2 Supported Repeat Types
NONE
DAILY
WEEKLY
MONTHLY
CUSTOM

3.3 Data Model
"repeatType": "NONE | DAILY | WEEKLY | MONTHLY | CUSTOM",
"repeatConfig": { ... }

3.4 Repeat Rules
NONE

Task fires once

After trigger → task expires

DAILY
{
  "intervalDays": 1
}

nextTrigger = lastTrigger + intervalDays

WEEKLY
{
  "daysOfWeek": ["MON", "WED"],
  "intervalWeeks": 1
}

MONTHLY
{
  "dayOfMonth": 15,
  "intervalMonths": 1
}


If day does not exist → skip that month.

CUSTOM

Must resolve to deterministic rules

No natural-language storage

3.5 Timezone & DST Rule

Repeat always uses stored timezone

Local wall-clock time must remain constant

3.6 Repeat Execution Flow

Main trigger fires

Mark current occurrence complete

If isActive = true and repeat ≠ NONE:

Compute next trigger

Apply notify-before offsets

Schedule new triggers

4️⃣ 🔔 NOTIFY BEFORE — PRE-NOTIFICATIONS
4.1 Purpose

Notify Before provides early warnings before the main trigger without modifying it.

4.2 Data Model
"preNotifyOffsets": ["PT5M", "PT15M", "PT1H"]

4.3 Trigger Rule

For each offset:

preNotifyTrigger = mainTrigger - offset

4.4 Rules

Each offset creates a separate notification

If calculated time is in the past → skip it

Main trigger must always fire

Applies to each repeat occurrence

Only active tasks schedule pre-notifications

4.5 Snooze Interaction

Pre-notifications are NOT replayed on snooze

5️⃣ 😴 SNOOZE — TEMPORARY DELAY
5.1 Purpose

Snooze allows the user to temporarily postpone a triggered alert.

5.2 Data Model
"snoozeEnabled": true,
"snoozeDuration": "PT5M | PT10M | PT30M"

5.3 Snooze Rule

When user taps Snooze:

snoozedTrigger = now + snoozeDuration

5.4 Rules

Snooze affects only the current occurrence

Snooze must not modify:

main trigger

repeat schedule

future occurrences

Snooze disabled when task is inactive

6️⃣ FEATURE INTERACTION SUMMARY
Feature	Scope
Active / Inactive	Global on/off
Repeat	Future occurrences
Notify Before	Early alerts
Snooze	Temporary delay

🚫 No feature may mutate another feature’s configuration.

7️⃣ EDGE CASE RULES

Inactive task must never notify

Reactivation must skip missed occurrences

Snoozed task deactivated → cancel snooze

Invalid repeatConfig → reject task creation

8️⃣ NON-REGRESSION REQUIREMENT

This implementation must not alter any existing functionality outside reminder scheduling. All current behaviors must remain unchanged.

9️⃣ FINAL ENFORCEMENT

Do NOT simplify
Do NOT infer
Do NOT invent defaults
Implement exactly as written

Repeat Execution Rule:
Repeat calculations must be based on the stored ISO timestamp (absolute instant). If the user changes timezone, future occurrences will fire at the equivalent local time of that instant. The system must not attempt to preserve wall-clock time across timezone changes.