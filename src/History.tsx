export interface DayEntry {
  breathe: number
  meditate: number
  move: number
  total: number
  checkins?: number[]
}

interface Props {
  data: Record<string, DayEntry>
  onBack: () => void
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return `${DAYS[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

function BreathIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v3" />
      <path d="M8 5c-1 0-2 .5-3 2s-1.5 3.5-1 5c.4 1.2 1.5 2 2.5 2 1 0 1.5-.8 1.5-2V7" />
      <path d="M8 5c1 0 2 .5 3 2s1.5 3.5 1 5c-.4 1.2-1.5 2-2.5 2-1 0-1.5-.8-1.5-2V7" />
    </svg>
  )
}

function MeditateIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13c0 0-3-2.5-3-5.5C5 5 6.5 3 8 3s3 2 3 4.5C11 10.5 8 13 8 13z" />
      <path d="M8 13c-1.5 0-4-1-4.5-3.5-.4-1.8.5-3.5 1.5-4" />
      <path d="M8 13c1.5 0 4-1 4.5-3.5.4-1.8-.5-3.5-1.5-4" />
      <path d="M4 13.5q4 1.5 8 0" />
    </svg>
  )
}

function MoveIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 8 H4.5 L5.5 4.5 L6.5 11.5 L7.5 8 H15" />
    </svg>
  )
}

export default function History({ data, onBack }: Props) {
  const days = getLast7Days()

  return (
    <div className="content">
      <h2 className="flow-title">history</h2>
      <div className="history-list">
        {days.map(date => {
          const entry = data[date]
          const total = entry?.total ?? 0
          return (
            <div key={date} className="history-row">
              <span className="history-date">{formatDate(date)}</span>
              {total === 0 ? (
                <span className="history-empty">—</span>
              ) : (
                <span className="history-counts">
                  {(entry?.breathe ?? 0) > 0 && (
                    <span className="history-type"><BreathIcon /> {entry.breathe}</span>
                  )}
                  {(entry?.meditate ?? 0) > 0 && (
                    <span className="history-type"><MeditateIcon /> {entry.meditate}</span>
                  )}
                  {(entry?.move ?? 0) > 0 && (
                    <span className="history-type"><MoveIcon /> {entry.move}</span>
                  )}
                  <span className="history-total">{total}</span>
                </span>
              )}
            </div>
          )
        })}
      </div>
      <button className="back-btn" onClick={onBack}>← back</button>
    </div>
  )
}
