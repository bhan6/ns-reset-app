use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

// ── TTS via macOS `say` ──────────────────────────────────────────────────────

struct SpeechState {
    child: Mutex<Option<std::process::Child>>,
    voice: String,
}

/// Query `say -v ?` and return the best available female enhanced voice.
fn detect_voice() -> String {
    let preferred = [
        "Susan (Enhanced)",
        "Ava (Premium)",
        "Ava (Enhanced)",
        "Allison (Enhanced)",
        "Samantha (Enhanced)",
        "Ava",
        "Allison",
        "Samantha",
    ];
    if let Ok(out) = std::process::Command::new("say").args(["-v", "?"]).output() {
        let text = String::from_utf8_lossy(&out.stdout);
        for name in preferred {
            if text.lines().any(|l| l.trim_start().starts_with(name)) {
                return name.to_string();
            }
        }
    }
    // Fall back to system default (no -v flag) by returning empty string
    String::new()
}

#[tauri::command]
fn speak_text(text: String, state: tauri::State<SpeechState>) {
    let mut guard = state.child.lock().unwrap();
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
    }
    let mut cmd = std::process::Command::new("say");
    if !state.voice.is_empty() {
        cmd.args(["-v", &state.voice]);
    }
    cmd.args(["-r", "150"]);
    cmd.arg(&text);
    if let Ok(child) = cmd.spawn() {
        *guard = Some(child);
    }
}

#[tauri::command]
fn stop_speech(state: tauri::State<SpeechState>) {
    let mut guard = state.child.lock().unwrap();
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
    }
}
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

struct TriggerState {
    is_pulsing: bool,
    last_session: Instant,
    active_secs: u64,
    interval_secs: u64,      // 0 = off
    threshold_secs: u64,     // 0 = off
    quiet_start_min: Option<u32>,
    quiet_end_min: Option<u32>,
}

fn parse_time_min(s: &str) -> Option<u32> {
    let (h, m) = s.split_once(':')?;
    Some(h.parse::<u32>().ok()? * 60 + m.parse::<u32>().ok()?)
}

/// Returns true if the current local time falls within the active window.
/// If no window is configured, always returns true.
fn in_active_window(start: Option<u32>, end: Option<u32>) -> bool {
    use chrono::Timelike;
    let (Some(s), Some(e)) = (start, end) else { return true };
    let now = chrono::Local::now();
    let current = now.hour() * 60 + now.minute();
    current >= s && current < e
}

fn normal_icon() -> tauri::image::Image<'static> {
    tauri::image::Image::new_owned(
        include_bytes!("../icons/tray-icon.rgba").to_vec(),
        32,
        32,
    )
}

fn pulse_icon() -> tauri::image::Image<'static> {
    tauri::image::Image::new_owned(
        include_bytes!("../icons/tray-icon-pulse.rgba").to_vec(),
        32,
        32,
    )
}

/// Query macOS HIDIdleTime via ioreg. Returns seconds of user inactivity.
fn idle_seconds() -> u64 {
    let Ok(out) = std::process::Command::new("ioreg")
        .args(["-c", "IOHIDSystem", "-d", "4"])
        .output()
    else {
        return 0;
    };
    let text = String::from_utf8_lossy(&out.stdout);
    for line in text.lines() {
        if line.contains("HIDIdleTime") {
            if let Some(v) = line.split('=').nth(1) {
                if let Ok(ns) = v.trim().parse::<u64>() {
                    return ns / 1_000_000_000;
                }
            }
        }
    }
    0
}

/// Called by the frontend whenever settings change.
#[tauri::command]
fn update_settings(
    interval_mins: Option<u64>,
    threshold_mins: Option<u64>,
    quiet_start: Option<String>,
    quiet_end: Option<String>,
    state: tauri::State<Arc<Mutex<TriggerState>>>,
) {
    let mut s = state.lock().unwrap();
    s.interval_secs = interval_mins.map(|m| m * 60).unwrap_or(0);
    s.threshold_secs = threshold_mins.map(|m| m * 60).unwrap_or(0);
    s.quiet_start_min = quiet_start.as_deref().and_then(parse_time_min);
    s.quiet_end_min = quiet_end.as_deref().and_then(parse_time_min);
}

/// Called by the frontend when a session fully completes.
#[tauri::command]
fn session_complete(
    state: tauri::State<Arc<Mutex<TriggerState>>>,
    app: tauri::AppHandle,
) {
    let mut s = state.lock().unwrap();
    s.is_pulsing = false;
    s.active_secs = 0;
    s.last_session = Instant::now();
    drop(s);
    if let Some(tray) = app.tray_by_id("main-tray") {
        let _ = tray.set_icon(Some(normal_icon()));
    }
}

pub fn run() {
    let trigger_state = Arc::new(Mutex::new(TriggerState {
        is_pulsing: false,
        last_session: Instant::now(),
        active_secs: 0,
        interval_secs: 90 * 60,
        threshold_secs: 90 * 60,
        quiet_start_min: Some(9 * 60),    // 09:00
        quiet_end_min: Some(18 * 60),     // 18:00
    }));

    let speech_state = SpeechState {
        child: Mutex::new(None),
        voice: detect_voice(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state() == ShortcutState::Pressed {
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .manage(trigger_state.clone())
        .manage(speech_state)
        .invoke_handler(tauri::generate_handler![session_complete, speak_text, stop_speech, update_settings])
        .setup(move |app| {
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&quit])?;

            let tray = TrayIconBuilder::with_id("main-tray")
                .icon(normal_icon())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        rect: _,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                if let Ok(Some(monitor)) = window.current_monitor() {
                                    let size = monitor.size();
                                    let pos = monitor.position();
                                    let _ = window.set_size(tauri::PhysicalSize::new(
                                        size.width,
                                        size.height,
                                    ));
                                    let _ = window.set_position(tauri::PhysicalPosition::new(
                                        pos.x, pos.y,
                                    ));
                                }
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    if event.id() == "quit" {
                        app.exit(0);
                    }
                })
                .build(app)?;

            // Keep tray alive for the app's lifetime
            app.manage(tray);

            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Register ⌘⇧R global shortcut
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            app.global_shortcut().register("CmdOrCtrl+Shift+R")?;

            // ── Poll thread: runs every 60s, checks idle time and triggers ──
            {
                let state = trigger_state.clone();
                let app_handle = app.handle().clone();
                std::thread::spawn(move || loop {
                    std::thread::sleep(Duration::from_secs(60));

                    let idle = idle_seconds();
                    let mut s = state.lock().unwrap();

                    if idle < 60 {
                        s.active_secs += 60;
                    } else if idle >= 300 {
                        // 5+ min idle: reset consecutive active time
                        s.active_secs = 0;
                    }

                    if !s.is_pulsing && in_active_window(s.quiet_start_min, s.quiet_end_min) {
                        let long_session = s.threshold_secs > 0
                            && s.active_secs >= s.threshold_secs;
                        let interval_due = s.interval_secs > 0
                            && s.last_session.elapsed()
                                >= Duration::from_secs(s.interval_secs);

                        if long_session || interval_due {
                            s.is_pulsing = true;
                            let active_mins = s.active_secs / 60;
                            drop(s);
                            let _ = app_handle.emit("trigger-pulse", active_mins);
                        }
                    }
                });
            }

            // ── Pulse animation thread: alternates icons every 1.5s ──
            {
                let state = trigger_state.clone();
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    let mut bright = false;
                    loop {
                        std::thread::sleep(Duration::from_millis(1500));
                        let s = state.lock().unwrap();
                        if s.is_pulsing {
                            bright = !bright;
                            drop(s);
                            if let Some(tray) = app_handle.tray_by_id("main-tray") {
                                let icon = if bright { pulse_icon() } else { normal_icon() };
                                let _ = tray.set_icon(Some(icon));
                            }
                        } else {
                            bright = false;
                        }
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Focused(false) = event {
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
