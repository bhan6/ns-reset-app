function HistoryIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M5 3V1M11 3V1M2 7h12" />
    </svg>
  )
}

interface Props {
  onSelect: (s: 'breathe' | 'meditate' | 'move') => void
  onHistory: () => void
  activeMins: number | null
  sessionCount: number
}

function LungsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v3" />
      <path d="M8 5c-1 0-2 .5-3 2s-1.5 3.5-1 5c.4 1.2 1.5 2 2.5 2 1 0 1.5-.8 1.5-2V7" />
      <path d="M8 5c1 0 2 .5 3 2s1.5 3.5 1 5c-.4 1.2-1.5 2-2.5 2-1 0-1.5-.8-1.5-2V7" />
    </svg>
  )
}

function LotusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13c0 0-3-2.5-3-5.5C5 5 6.5 3 8 3s3 2 3 4.5C11 10.5 8 13 8 13z" />
      <path d="M8 13c-1.5 0-4-1-4.5-3.5-.4-1.8.5-3.5 1.5-4" />
      <path d="M8 13c1.5 0 4-1 4.5-3.5.4-1.8-.5-3.5-1.5-4" />
      <path d="M4 13.5q4 1.5 8 0" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8 H4.5 L5.5 4.5 L6.5 11.5 L7.5 8 H15" />
    </svg>
  )
}

export default function Picker({ onSelect, onHistory, activeMins, sessionCount }: Props) {
  const subtitle = activeMins && activeMins > 0
    ? `you've been at it ${activeMins} min`
    : 'reset before you go'

  return (
    <div className="content">
      <div className="picker-header">
        <h1>{subtitle}</h1>
        <p className="picker-sub">choose a practice</p>
      </div>
      <div className="session-list">
        <button className="session-btn picker-card" onClick={() => onSelect('breathe')}>
          <LungsIcon />
          <span className="card-text">
            <span>breathe</span>
            <span className="card-desc">30 sec - 2 min breathing exercises</span>
          </span>
        </button>
        <button className="session-btn picker-card" onClick={() => onSelect('meditate')}>
          <LotusIcon />
          <span className="card-text">
            <span>meditate</span>
            <span className="card-desc">2 or 5 min meditation session</span>
          </span>
        </button>
        <button className="session-btn picker-card" onClick={() => onSelect('move')}>
          <PulseIcon />
          <span className="card-text">
            <span>move</span>
            <span className="card-desc">20 – 60 sec · stretch & reset</span>
          </span>
        </button>
      </div>
      <div className="footer">
        <span className="count">{sessionCount} {sessionCount === 1 ? 'session' : 'sessions'} today</span>
        <button className="history-btn" onClick={onHistory}><HistoryIcon /></button>
      </div>
    </div>
  )
}
