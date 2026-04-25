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
import CheckIn from './CheckIn'
import History, { DayEntry, getLast7Days } from './History'

function GearIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  )
}

type Screen = 'picker' | 'breathe' | 'meditate' | 'move' | 'done' | 'settings' | 'checkin' | 'history'

const appWindow = getCurrentWindow()

const today = () => new Date().toISOString().split('T')[0]

type SessionType = 'breathe' | 'meditate' | 'move'

async function loadHistory(): Promise<Record<string, DayEntry>> {
  const store = await load('history.json', { autoSave: false, defaults: {} })
  const result: Record<string, DayEntry> = {}
  for (const date of getLast7Days()) {
    const entry = await store.get<DayEntry>(date)
    if (entry) result[date] = entry
  }
  return result
}

async function recordSession(type: SessionType): Promise<{ todayCount: number; history: Record<string, DayEntry> }> {
  const store = await load('history.json', { autoSave: false, defaults: {} })
  const date = today()
  const existing: DayEntry = (await store.get<DayEntry>(date)) ?? { breathe: 0, meditate: 0, move: 0, total: 0 }
  const updated: DayEntry = { ...existing, [type]: existing[type] + 1, total: existing.total + 1 }
  await store.set(date, updated)
  await store.save()
  const history = await loadHistory()
  return { todayCount: updated.total, history }
}

async function recordCheckin(score: number): Promise<Record<string, DayEntry>> {
  const store = await load('history.json', { autoSave: false, defaults: {} })
  const date = today()
  const existing: DayEntry = (await store.get<DayEntry>(date)) ?? { breathe: 0, meditate: 0, move: 0, total: 0 }
  const updated: DayEntry = { ...existing, checkins: [...(existing.checkins ?? []), score] }
  await store.set(date, updated)
  await store.save()
  return loadHistory()
}

async function loadSettings(): Promise<SettingsValues> {
  const store = await load('settings.json', { autoSave: false, defaults: {} })
  return {
    interval_mins:  (await store.get<number | null>('interval_mins'))  ?? DEFAULT_SETTINGS.interval_mins,
    threshold_mins: (await store.get<number | null>('threshold_mins')) ?? DEFAULT_SETTINGS.threshold_mins,
    quiet_start:    (await store.get<string | null>('quiet_start'))    ?? DEFAULT_SETTINGS.quiet_start,
    quiet_end:      (await store.get<string | null>('quiet_end'))      ?? DEFAULT_SETTINGS.quiet_end,
    checkin_time:   (await store.get<string | null>('checkin_time'))   ?? DEFAULT_SETTINGS.checkin_time,
  }
}

async function persistSettings(s: SettingsValues): Promise<void> {
  const store = await load('settings.json', { autoSave: false, defaults: {} })
  await store.set('interval_mins',  s.interval_mins)
  await store.set('threshold_mins', s.threshold_mins)
  await store.set('quiet_start',    s.quiet_start)
  await store.set('quiet_end',      s.quiet_end)
  await store.set('checkin_time',   s.checkin_time)
  await store.save()
}

function applySettings(s: SettingsValues) {
  invoke('update_settings', {
    intervalMins:  s.interval_mins,
    thresholdMins: s.threshold_mins,
    quietStart:    s.quiet_start,
    quietEnd:      s.quiet_end,
    checkinTime:   s.checkin_time,
  }).catch(console.error)
}

function App() {
  const [screen, setScreen] = useState<Screen>('picker')
  const [activeMins, setActiveMins] = useState<number | null>(null)
  const [sessionCount, setSessionCount] = useState(0)
  const [historyData, setHistoryData] = useState<Record<string, DayEntry>>({})
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

  // Listen for trigger-checkin events from Rust
  useEffect(() => {
    let unlisten: (() => void) | undefined
    listen('trigger-checkin', () => {
      setScreen('checkin')
    }).then(fn => { unlisten = fn })
    return () => unlisten?.()
  }, [])

  // Load persisted data on mount
  useEffect(() => {
    loadHistory().then(h => {
      setHistoryData(h)
      const todayEntry = h[today()]
      setSessionCount(todayEntry?.total ?? 0)
    }).catch(console.error)
    loadSettings().then(s => {
      setSettings(s)
      applySettings(s)
    }).catch(console.error)
  }, [])

  const complete = useCallback(() => {
    const type = screen as SessionType
    invoke('session_complete').catch(console.error)
    recordSession(type).then(({ todayCount, history }) => {
      setSessionCount(todayCount)
      setHistoryData(history)
    }).catch(console.error)
    setActiveMins(null)
    setScreen('done')
  }, [screen])

  const completeCheckin = useCallback((score: number) => {
    recordCheckin(score).then(setHistoryData).catch(console.error)
    if (score >= 4) {
      invoke('trigger_pulse_manual').catch(console.error)
    }
    setScreen('picker')
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
      {screen === 'picker'   && <Picker onSelect={(s) => setScreen(s)} onHistory={() => setScreen('history')} activeMins={activeMins} sessionCount={sessionCount} />}
      {screen === 'breathe'  && <BreatheFlow  onComplete={complete} onStop={back} />}
      {screen === 'meditate' && <MeditateFlow onComplete={complete} onStop={back} />}
      {screen === 'move'     && <MoveSession  onComplete={complete} onStop={back} />}
      {screen === 'done'     && <Done onClose={hide} onBack={back} />}
      {screen === 'settings' && <Settings initial={settings} onSave={handleSaveSettings} onBack={back} />}
      {screen === 'checkin'  && <CheckIn onComplete={completeCheckin} onSkip={back} />}
      {screen === 'history'  && <History data={historyData} onBack={back} />}
    </div>
  )
}

export default App
