interface Props {
  onComplete: (score: number) => void
  onSkip: () => void
}

export default function CheckIn({ onComplete, onSkip }: Props) {
  return (
    <div className="content">
      <div className="checkin-header">
        <h2 className="flow-title">check in</h2>
        <h1>stress level right now?</h1>
      </div>
      <div className="checkin-scale">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className="checkin-btn"
            onClick={() => onComplete(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="checkin-labels">
        <span>calm</span>
        <span>overwhelmed</span>
      </div>
      <button className="back-btn" onClick={onSkip}>skip</button>
    </div>
  )
}
