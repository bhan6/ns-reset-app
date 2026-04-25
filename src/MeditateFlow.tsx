import { useState, useEffect, useRef } from 'react'

function playBell() {
  const ctx = new AudioContext()
  const master = ctx.createGain()
  master.connect(ctx.destination)

  // Lower fundamental for warmth; two quiet harmonics for bowl timbre
  // Two slightly detuned copies of the fundamental add natural shimmer
  const partials: [number, number][] = [
    [340, 0.22],
    [341.5, 0.06],
    [680, 0.07],
    [1020, 0.025],
  ]

  const attack = 0.5   // seconds to swell in
  const decay = 7      // seconds to fade out

  partials.forEach(([freq, amp]) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(master)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    // Start silent, swell gently, then fade to nothing
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(amp, ctx.currentTime + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + decay)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + decay)
  })

  setTimeout(() => ctx.close(), (decay + 1) * 1000)
}

type Duration = 2 | 5
type Focus = 'grounding' | 'awareness' | 'compassion'

const PROMPTS: Record<Focus, string[]> = {
  grounding: [
    'Close your eyes. Settle in.',
    'Notice 5 things you can feel right now.',
    'Feel the weight of your body against the chair.',
    'Notice the temperature of the air on your skin.',
    'Feel your feet solid on the floor.',
  ],
  awareness: [
    'Let your attention open and soften.',
    'Notice sounds without labeling them.',
    'Let thoughts come and go like clouds.',
    'Rest in the open space of awareness.',
    'Nothing to fix. Nowhere to be.',
  ],
  compassion: [
    'Place one hand on your chest.',
    'Acknowledge: this is a hard moment.',
    "You're doing your best.",
    'May you be at ease.',
    'Rest in kindness toward yourself.',
  ],
}

interface Props {
  onComplete: () => void
  onStop: () => void
}

export default function MeditateFlow({ onComplete, onStop }: Props) {
  const [step, setStep] = useState<'pick' | 'session'>('pick')
  const [duration, setDuration] = useState<Duration>(2)
  const [focus, setFocus] = useState<Focus>('grounding')

  if (step === 'pick') {
    return (
      <div className="content">
        <h2 className="flow-title">meditate</h2>
        <div className="pick-group">
          <p className="pick-label">duration</p>
          <div className="pick-row">
            {([2, 5] as Duration[]).map(d => (
              <button
                key={d}
                className={`pick-btn ${duration === d ? 'active' : ''}`}
                onClick={() => setDuration(d)}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div className="pick-group">
          <p className="pick-label">focus</p>
          <div className="session-list">
            {(['grounding', 'awareness', 'compassion'] as Focus[]).map(f => (
              <button
                key={f}
                className={`session-btn ${focus === f ? 'active' : ''}`}
                onClick={() => setFocus(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button className="primary-btn" onClick={() => setStep('session')}>begin</button>
        <button className="back-btn" onClick={onStop}>← back</button>
      </div>
    )
  }

  return (
    <MeditateSession
      duration={duration}
      focus={focus}
      onComplete={onComplete}
      onStop={onStop}
    />
  )
}


const RADIUS = 43
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function MeditateSession({
  duration,
  focus,
  onComplete,
  onStop,
}: {
  duration: Duration
  focus: Focus
  onComplete: () => void
  onStop: () => void
}) {
  const totalSeconds = duration * 60
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds)
  const [promptIdx, setPromptIdx] = useState(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const prompts = PROMPTS[focus]

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval)
          playBell()
          onCompleteRef.current()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line

  useEffect(() => {
    // Distribute prompts evenly across the session
    const step = Math.floor(totalSeconds / prompts.length)
    const timers = prompts.map((_, i) =>
      setTimeout(() => setPromptIdx(i), i * step * 1000)
    )
    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line


  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  // Arc drains from full to empty as time elapses
  const dashoffset = CIRCUMFERENCE * (1 - secondsLeft / totalSeconds)

  return (
    <div className="meditate-session">
      <div className="meditate-arc">
        <svg width="144" height="144" viewBox="0 0 144 144">
          <circle cx="72" cy="72" r={RADIUS} stroke="#221d16" strokeWidth="1" fill="none" />
          <circle
            cx="72" cy="72" r={RADIUS}
            stroke="#6b5035"
            strokeWidth="1"
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            transform="rotate(-90 72 72)"
          />
        </svg>
        <p className="meditate-timer">{mins}:{secs.toString().padStart(2, '0')}</p>
      </div>
      <p className="meditate-prompt">{prompts[promptIdx]}</p>
      <button className="stop-btn" onClick={onStop}>stop</button>
    </div>
  )
}
