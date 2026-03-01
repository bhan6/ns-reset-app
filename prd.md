# Nervous System Reset — Mac Menu Bar App
**Product Requirements Document**

---

## Overview

A lightweight Mac menu bar app (~20-50MB RAM) that helps a knowledge worker interrupt stress cycles during the workday with short nervous system reset practices. The app lives unobtrusively in the menu bar and signals when a reset is due by pulsing its icon — never popping up uninvited. The user opens it when ready, picks a session type, and is back to work in under 5 minutes.

---

## Problem

Knowledge workers accumulate hours of sympathetic nervous system activation — back-to-back meetings, context-switching, deadline pressure — with no natural recovery windows. Existing wellness apps require deliberate effort to open and feel separate from the work context. What's needed is a tool that's always ambient, never intrusive, and frictionless to use when you need it.

---

## Goals

1. Surface reset suggestions at contextually appropriate moments without interrupting focus
2. Make starting a session require one click, not a decision tree
3. Keep sessions under 5 minutes with zero setup
4. Stay out of the way — the app should feel like it barely exists until needed

---

## Target User

A solo Mac-based knowledge worker who is aware of the stress-recovery cycle, works long focused sessions, and wants a tool that fades into the background until needed. Values privacy, performance, and simplicity over features.

---

## Technical Stack

**Framework:** Tauri (Rust backend + React/HTML/CSS frontend via macOS WKWebView)
- RAM target: ~20-50MB (vs. Electron's 150-300MB — no bundled Chromium)
- Binary size: ~10MB
- All data is local. No network calls, no accounts, no telemetry.

**Rust backend handles:**
- `tauri::SystemTray` — tray icon, icon state changes, pulse animation
- Idle detection via macOS IOKit (`HIDIdleTime`) — tracks active keyboard/mouse time
- Interval scheduling (reminder timers)
- Calendar polling via AppleScript bridge (post-MVP)
- IPC to renderer via Tauri commands/events

**React/HTML renderer handles:**
- Quick picker UI
- All session UIs (breathing animation, meditation timer, movement cards)
- History view (7-day log)
- Settings panel

**Storage:**
- `tauri-plugin-sql` (SQLite) for session logs
- `tauri-plugin-store` for user preferences (JSON)

---

## Core Features

### 1. Menu Bar Icon

- Persistent tray icon — small, simple glyph (e.g. a wave or soft circle)
- **Icon states:**
  - Default/calm: static, low-contrast
  - Reset suggested: gentle pulse animation (CSS-driven via tray icon swap)
  - Session active: distinct "in session" state
- Left-click: opens the popover
- Right-click: quick menu — "Pause reminders", "Settings", "Quit"
- Keyboard shortcut (configurable, default: `⌘⇧R`) to open instantly

**Focus behavior:** When any other app is fullscreen or a full-screen space is active, icon state updates normally but the popover never opens automatically. No notifications fire. The user retains full control.

---

### 2. Popover Layout

Compact dark popover (~280×340px) anchored below the menu bar icon. Soft dark background, muted colors, rounded corners. Feels ambient, not clinical.

```
┌─────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░  │
│  ░  reset your system  ░  │
│  ░░░░░░░░░░░░░░░░░░░░░  │
│                         │
│   ◈ breathe             │
│   ◈ meditate            │
│   ◈ move                │
│                         │
│  ··· 2 today  [⚙]  [×] │
└─────────────────────────┘
```

- Header section: "reset your system" (or contextual subtitle: "you've been at it 96 min")
- Three session type rows — tap one to begin
- Footer: today's reset count, gear icon (settings), close button
- No home screen / dashboard — the picker IS the home screen

---

### 3. Session Types

#### Breathing Exercises

Three techniques, selectable after choosing "breathe":

| Technique | Pattern | Duration |
|---|---|---|
| Physiological sigh | Double inhale + long exhale | ~30 seconds |
| Box breathing | 4s in · 4s hold · 4s out · 4s hold | ~4 minutes (4 cycles) |
| 4-7-8 | 4s in · 7s hold · 8s out | ~2 minutes (4 cycles) |

- **Animation:** Expanding/contracting circle (CSS transition). Dark background, soft glow. Phase label ("inhale", "hold", "exhale") updates in sync.
- **Audio:** Off by default. Toggle plays a soft binaural tone or singing bowl mark at each phase transition.
- **Controls:** Pause / stop. Session auto-completes and logs.

#### Short Meditations

Two durations: 2 min or 5 min. Three focuses:

- **Grounding** — sensory anchor (notice 5 things you can feel)
- **Open awareness** — broaden attention, release fixation
- **Self-compassion** — brief self-directed kindness prompt

Each session is text-only prompts displayed at timed intervals + a subtle countdown arc. No voice in MVP. Option to run as pure silent timer (blank screen + arc).

Audio option: soft ambient loop (rain, white noise) plays during session when toggled.

#### Movement / Micro-breaks

Single illustrated prompt card per session. Cards cycle through the day (no repeats until all shown):

- Neck and shoulder release (60s)
- Eye reset — 20-20-20 rule (20s focus far away)
- Spinal decompression stretch (60s)
- Hand and wrist release (45s)
- Standing posture check + deep breath (30s)

Each card shows: illustration/icon, instruction text, timer countdown. Auto-completes and logs.

---

### 4. Trigger System

All triggers manifest **solely as icon pulse**. No macOS notifications. No auto-opening popovers. The user decides when to act on the signal.

#### Scheduled Intervals
- User sets a reminder interval: every 60, 90, or 120 minutes
- User sets a quiet hours window (e.g. 9am–6pm only)
- When interval elapses during the active window: icon begins pulsing
- After completing or dismissing a session: timer resets

#### Long Work Session Detection
- Rust backend polls `HIDIdleTime` (IOKit) every 60 seconds
- "Active" = mouse/keyboard used within last 60 seconds
- After 90+ consecutive minutes of activity: icon begins pulsing + popover subtitle updates to "you've been at it 94 min"
- Timer resets after any completed session or 5+ minutes of idle

#### Manual Check-In
- At a configurable time (e.g. 2pm daily): popover auto-opens to a brief check-in
- One question: "Stress level right now?" — tap 1–5
- Score ≥ 4: icon begins pulsing immediately
- Score logged alongside session data for 7-day trend

#### Calendar Integration *(Post-MVP)*
- Read-only access to macOS Calendar via AppleScript (`tell application "Calendar"`)
- Pulse before back-to-back meetings (5 min gap or less)
- Pulse after meetings > 60 min
- No data leaves the device

---

### 5. Settings Panel

Opened via gear icon (⚙) in the popover footer. Inline panel within the same popover — no separate window.

| Setting | Options |
|---|---|
| Reminder interval | 60 / 90 / 120 min (or Off) |
| Quiet hours | Start time → End time |
| Long session threshold | 60 / 90 / 120 min (or Off) |
| Check-in time | Time picker (or Off) |
| Audio | Off / Ambient tones |
| Keyboard shortcut | Configurable |

---

### 6. History (7-Day Log)

Accessible via a "history" tab or small calendar icon in the popover footer.

- Row per day: date, total count, type breakdown (breath / meditate / move icons with counts)
- Last 7 days only — no longer retention in MVP
- No charts, no streak counter — informational only
- Stored in local SQLite; never synced

---

## Session Flow

1. User sees icon pulsing (or decides they need a reset)
2. Clicks menu bar icon → popover opens to quick picker
3. Taps session type (breathe / meditate / move)
4. Selects specific technique/duration if applicable
5. Session runs in-popover with animation/timer
6. On complete: brief text acknowledgment ("done."), session logged, popover stays open 3s then closes
7. Icon returns to calm state; relevant timers reset

---

## MVP Scope

**In MVP:**
- Menu bar icon with pulse states
- Quick picker entry UI (soft dark aesthetic)
- All three session types with 2–3 techniques each
- Scheduled interval trigger (icon pulse only)
- Long work session detection (idle tracking via IOKit)
- Manual check-in prompt
- 7-day session log
- Settings panel inside popover
- Keyboard shortcut to open

**Post-MVP:**
- Calendar integration
- Audio content (ambient loop, phase tones)
- Icon pulse animation (v1 can use static icon swap)
- Weekly summary
- Customizable breathing patterns
- Export session data

---

## Non-Goals

- No macOS notification banners or badges — ever
- No gamification (streaks, points, rewards)
- No accounts, sync, or network connectivity
- No iOS/Android version
- No biometric integration (HRV, Apple Watch)
- No social features

---

## Success Criteria (Personal)

- App uses < 50MB RAM at idle
- Completing 2+ resets per workday feels natural, not effortful
- The app never feels annoying or demanding
- End-of-day cognitive fatigue is subjectively lower than baseline
