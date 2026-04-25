import { useState, useEffect, useRef } from 'react'

const CARDS = [
  {
    title: 'Neck & shoulder release',
    instruction: 'Slowly roll your neck ear-to-shoulder on each side. Let your shoulder blades drop. Breathe.',
    duration: 60,
  },
  {
    title: 'Eye reset',
    instruction: 'Find something at least 20 feet away and focus on it for 20 seconds. Blink slowly. Let your eyes soften.',
    duration: 20,
  },
  {
    title: 'Spinal decompression',
    instruction: 'Stand up. Reach your arms overhead and gently sway side to side. Let your spine lengthen.',
    duration: 60,
  },
  {
    title: 'Hand & wrist release',
    instruction: 'Extend your arms forward. Spread your fingers wide, then make loose fists. Rotate your wrists slowly.',
    duration: 45,
  },
  {
    title: 'Posture check',
    instruction: 'Stand tall. Roll your shoulders back and down. Take one deep breath in and let it go.',
    duration: 30,
  },
]

interface Props {
  onComplete: () => void
  onStop: () => void
}

export default function MoveSession({ onComplete, onStop }: Props) {
  const [card] = useState(() => CARDS[Math.floor(Math.random() * CARDS.length)])
  const [secondsLeft, setSecondsLeft] = useState(card.duration)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval)
          onCompleteRef.current()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  return (
    <div className="move-session">
      <h2 className="move-title">{card.title}</h2>
      <p className="move-instruction">{card.instruction}</p>
      <p className="move-timer">{secondsLeft}</p>
      <button className="stop-btn" onClick={onStop}>stop</button>
    </div>
  )
}
