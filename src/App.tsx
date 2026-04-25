import { useState, useCallback, useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { load } from '@tauri-apps/plugin-store'
import Picker from './Picker'
import BreatheFlow from './BreatheFlow'
import MeditateFlow from './MeditateFlow'
import MoveSession from './MoveSession'
import Done from './Done'
import Settings, { SettingsValues, DEFAULT_SETTINGS } from './Settings'

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  )
}

type Screen = 'picker' | 'breathe' | 'meditate' | 'move' | 'done' | 'settings'

const appWindow = getCurrentWindow()

const today = () => new Date().toISOString().split('T')[0]

async function loadTodayCount(): Promise<number> {
  const store = await load('sessions.json', { autoSave: false, defaults: {} })
  const date = await store.get<string>('date')
  if (date !== today()) {
    await store.set('date', today())
    await store.set('count', 0)
    await store.save()
    return 0
  }
  return (await store.get<number>('count')) ?? 0
}

async function incrementTodayCount(): Promise<number> {
  const store = await load('sessions.json', { autoSave: false, defaults: {} })
  const date = await store.get<string>('date')
  const count = date === today() ? ((await store.get<number>('count')) ?? 0) + 1 : 1
  await store.set('date', today())
  await store.set('count', count)
  await store.save()
  return count
}

async function loadSettings(): Promise<SettingsValues> {
  const store = await load('settings.json', { autoSave: false, defaults: {} })
  return {
    interval_mins:  (await store.get<number | null>('interval_mins'))  ?? DEFAULT_SETTINGS.interval_mins,
    threshold_mins: (await store.get<number | null>('threshold_mins')) ?? DEFAULT_SETTINGS.threshold_mins,
    quiet_start:    (await store.get<string | null>('quiet_start'))    ?? DEFAULT_SETTINGS.quiet_start,
    quiet_end:      (await store.get<string | null>('quiet_end'))      ?? DEFAULT_SETTINGS.quiet_end,
  }
}

async function persistSettings(s: SettingsValues): Promise<void> {
  const store = await load('settings.json', { autoSave: false, defaults: {} })
  await store.set('interval_mins',  s.interval_mins)
  await store.set('threshold_mins', s.threshold_mins)
  await store.set('quiet_start',    s.quiet_start)
  await store.set('quiet_end',      s.quiet_end)
  await store.save()
}

function applySettings(s: SettingsValues) {
  invoke('update_settings', {
    intervalMins:  s.interval_mins,
    thresholdMins: s.threshold_mins,
    quietStart:    s.quiet_start,
    quietEnd:      s.quiet_end,
  }).catch(console.error)
}

function App() {
  const [screen, setScreen] = useState<Screen>('picker')
  const [activeMins, setActiveMins] = useState<number | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [settings, setSettings] = useState<SettingsValues>(DEFAULT_SETTINGS)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') appWindow.hide()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Listen for trigger-pulse events from Rust
  useEffect(() => {
    let unlisten: (() => void) | undefined
    listen<number>('trigger-pulse', (event) => {
      setActiveMins(event.payload)
    }).then(fn => { unlisten = fn })
    return () => unlisten?.()
  }, [])

  // Load persisted data on mount
  useEffect(() => {
    loadTodayCount().then(setSessionCount).catch(console.error)
    loadSettings().then(s => {
      setSettings(s)
      applySettings(s)
    }).catch(console.error)
  }, [])

  const complete = useCallback(() => {
    invoke('session_complete').catch(console.error)
    incrementTodayCount().then(setSessionCount).catch(console.error)
    setActiveMins(null)
    setScreen('done')
  }, [])

  const handleSaveSettings = useCallback((s: SettingsValues) => {
    setSettings(s)
    applySettings(s)
    persistSettings(s).catch(console.error)
  }, [])

  const back = useCallback(() => setScreen('picker'), [])
  const hide = useCallback(() => appWindow.hide(), [])

  return (
    <div className="container">
      <div className="top-bar">
        {screen === 'picker' && (
          <button className="gear-btn" onClick={() => setScreen('settings')}>
            <GearIcon />
          </button>
        )}
        <button className="close-btn" onClick={hide}>×</button>
      </div>
      {screen === 'picker'   && <Picker onSelect={(s) => setScreen(s)} activeMins={activeMins} sessionCount={sessionCount} />}
      {screen === 'breathe'  && <BreatheFlow  onComplete={complete} onStop={back} />}
      {screen === 'meditate' && <MeditateFlow onComplete={complete} onStop={back} />}
      {screen === 'move'     && <MoveSession  onComplete={complete} onStop={back} />}
      {screen === 'done'     && <Done onClose={hide} onBack={back} />}
      {screen === 'settings' && <Settings initial={settings} onSave={handleSaveSettings} onBack={back} />}
    </div>
  )
}

export default App
