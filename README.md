# ns-reset-app

A macOS menu-bar app that nudges you to take mindful breaks during long work sessions. Choose from breathing exercises, meditation, or movement — and carry forward.

![Tauri](https://img.shields.io/badge/Tauri-v2-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Rust](https://img.shields.io/badge/Rust-orange)

---

## Features

- **Breathe** — Guided breathing with three techniques:
  - Physiological sigh (~30 sec)
  - Box breathing (~1 min)
  - 4-7-8 (~2 min)
- **Meditate** — 2 or 5 min sessions with grounding, awareness, or self-compassion focus. Timed prompts, countdown arc, and a synthesized singing-bowl bell at the end.
- **Move** — A randomly picked stretch or reset card (neck release, eye reset, spinal decompression, etc.) with a countdown timer.
- **Smart reminders** — The tray icon pulses when you've been active too long or it's been a while since your last session. Respects a configurable quiet hours window.
- **Daily check-in** — At a configurable time, the app opens a quick 1–5 stress prompt. A score of 4 or 5 pulses the icon immediately as a nudge to reset. Scores are stored alongside session data.
- **7-day history** — A per-day breakdown of completed sessions by type, accessible from the picker footer.
- **Global shortcut** — `⌘⇧R` toggles the window from anywhere.

## How it works

A background Rust thread polls every 60 seconds, checking macOS `HIDIdleTime` to track consecutive active time. It fires a reminder when:

- You've been active for longer than the **long session threshold**, or
- Enough time has passed since your **last completed session**

Reminders only fire within your configured **active hours** window (default 09:00–18:00). The daily check-in fires once per day at the configured time and auto-opens the popover.

## Settings

| Setting | Default | Description |
|---|---|---|
| Reminder interval | 90 min | Time since last session before nudging |
| Long session threshold | 90 min | Consecutive active time before nudging |
| Active hours | 09:00 – 18:00 | Window in which reminders fire |
| Daily check-in | Off | Time to open a 1–5 stress prompt each day |

## Tech stack

- [Tauri v2](https://tauri.app) — native macOS app shell
- React 18 + TypeScript + Vite — frontend
- `tauri-plugin-store` — persistent settings and session history
- `tauri-plugin-global-shortcut` — `⌘⇧R` hotkey
- Web Audio API — synthesized bell sound (no audio files)
- macOS `ioreg` / `HIDIdleTime` — idle time detection
- macOS `say` — optional TTS

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build
npm run tauri build
```

> Requires [Rust](https://rustup.rs) and the [Tauri CLI prerequisites](https://tauri.app/start/prerequisites/).
