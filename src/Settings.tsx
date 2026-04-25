import { useState } from 'react'

export interface SettingsValues {
  interval_mins: number | null
  threshold_mins: number | null
  quiet_start: string | null
  quiet_end: string | null
}

export const DEFAULT_SETTINGS: SettingsValues = {
  interval_mins: 90,
  threshold_mins: 90,
  quiet_start: '09:00',
  quiet_end: '18:00',
}

interface Props {
  initial: SettingsValues
  onSave: (s: SettingsValues) => void
  onBack: () => void
}

const INTERVAL_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'off' },
  { value: 60,   label: '60m' },
  { value: 90,   label: '90m' },
  { value: 120,  label: '120m' },
]

function Tooltip({ text }: { text: string }) {
  return (
    <span className="tooltip-wrap">
      <span className="tooltip-icon">i</span>
      <span className="tooltip-box">{text}</span>
    </span>
  )
}

export default function Settings({ initial, onSave, onBack }: Props) {
  const [vals, setVals] = useState<SettingsValues>(initial)

  const update = (patch: Partial<SettingsValues>) => {
    const next = { ...vals, ...patch }
    setVals(next)
    onSave(next)
  }

  return (
    <div className="content">
      <h2 className="flow-title">settings</h2>

      <div className="setting-group">
        <div className="setting-label-row">
          <p className="setting-label">reminder interval</p>
          <Tooltip text="How often to pulse the icon as a nudge to reset. Timer restarts after each completed session." />
        </div>
        <div className="pick-row">
          {INTERVAL_OPTIONS.map(({ value, label }) => (
            <button
              key={label}
              className={`pick-btn ${vals.interval_mins === value ? 'active' : ''}`}
              onClick={() => update({ interval_mins: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label-row">
          <p className="setting-label">long session</p>
          <Tooltip text="Triggers a reminder after this many consecutive minutes of keyboard or mouse activity." />
        </div>
        <div className="pick-row">
          {INTERVAL_OPTIONS.map(({ value, label }) => (
            <button
              key={label}
              className={`pick-btn ${vals.threshold_mins === value ? 'active' : ''}`}
              onClick={() => update({ threshold_mins: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">
        <div className="setting-label-row">
          <p className="setting-label">active hours</p>
          <Tooltip text="Reminders only fire within this window. The icon stays calm outside these hours." />
        </div>
        <div className="time-row">
          <input
            type="time"
            className="time-input"
            value={vals.quiet_start ?? '09:00'}
            onChange={e => update({ quiet_start: e.target.value || null })}
          />
          <span className="time-sep">→</span>
          <input
            type="time"
            className="time-input"
            value={vals.quiet_end ?? '18:00'}
            onChange={e => update({ quiet_end: e.target.value || null })}
          />
        </div>
      </div>

      <button className="back-btn" onClick={onBack}>← back</button>
    </div>
  )
}
