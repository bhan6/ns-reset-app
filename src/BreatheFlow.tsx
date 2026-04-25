import { useState, useEffect, useRef } from 'react'

type Technique = 'sigh' | 'box' | '478'

interface Phase {
  label: string
  scale: number
  duration: number
}

interface TechConfig {
  name: string
  desc: string
  cycles: number
  phases: Phase[]
}

const TECHNIQUES: Record<Technique, TechConfig> = {
  sigh: {
    name: 'physiological sigh',
    desc: '~30 sec',
    cycles: 3,
    phases: [
      { label: 'inhale',       scale: 0.8,  duration: 2000 },
      { label: 'inhale more',  scale: 1.0,  duration: 1000 },
      { label: 'exhale slowly',scale: 0.15, duration: 6000 },
    ],
  },
  box: {
    name: 'box breathing',
    desc: '~1 min',
    cycles: 4,
    phases: [
      { label: 'inhale', scale: 1.0,  duration: 4000 },
      { label: 'hold',   scale: 1.0,  duration: 4000 },
      { label: 'exhale', scale: 0.15, duration: 4000 },
      { label: 'hold',   scale: 0.15, duration: 4000 },
    ],
  },
  '478': {
    name: '4-7-8',
    desc: '~2 min',
    cycles: 4,
    phases: [
      { label: 'inhale', scale: 1.0,  duration: 4000 },
      { label: 'hold',   scale: 1.0,  duration: 7000 },
      { label: 'exhale', scale: 0.15, duration: 8000 },
    ],
  },
}

interface Props {
  onComplete: () => void
  onStop: () => void
}

export default function BreatheFlow({ onComplete, onStop }: Props) {
  const [step, setStep] = useState<'pick' | 'session'>('pick')
  const [technique, setTechnique] = useState<Technique>('sigh')

  if (step === 'pick') {
    return (
      <div className="content">
        <h2 className="flow-title">breathe</h2>
        <div className="session-list">
          {(['sigh', 'box', '478'] as Technique[]).map((key) => {
            const t = TECHNIQUES[key]
            return (
              <button
                key={key}
                className="session-btn"
                onClick={() => { setTechnique(key); setStep('session') }}
              >
                <span>{t.name}</span>
                <span className="session-meta">{t.desc}</span>
              </button>
            )
          })}
        </div>
        <button className="back-btn" onClick={onStop}>← back</button>
      </div>
    )
  }

  return (
    <BreatheSession
      technique={TECHNIQUES[technique]}
      onComplete={onComplete}
      onStop={onStop}
    />
  )
}

function BreatheSession({
  technique,
  onComplete,
  onStop,
}: {
  technique: TechConfig
  onComplete: () => void
  onStop: () => void
}) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [cycleIdx, setCycleIdx] = useState(0)
  const [scale, setScale] = useState(0.15)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const phase = technique.phases[phaseIdx]

  useEffect(() => {
    let cancelled = false
    let timerId: ReturnType<typeof setTimeout>

    const run = (ci: number, pi: number) => {
      if (cancelled) return
      const p = technique.phases[pi]
      setPhaseIdx(pi)
      setCycleIdx(ci)
      setScale(p.scale)
      timerId = setTimeout(() => {
        if (cancelled) return
        const nextPi = pi + 1
        if (nextPi >= technique.phases.length) {
          const nextCi = ci + 1
          if (nextCi >= technique.cycles) {
            onCompleteRef.current()
            return
          }
          run(nextCi, 0)
        } else {
          run(ci, nextPi)
        }
      }, p.duration)
    }

    run(0, 0)
    return () => {
      cancelled = true
      clearTimeout(timerId)
    }
  }, [technique]) // eslint-disable-line

  return (
    <div className="breathe-session">
      <div className="breathe-circle-wrap">
        <div
          className="breathe-circle"
          style={{
            transform: `scale(${scale})`,
            transition: `transform ${phase.duration}ms ease-in-out`,
          }}
        />
      </div>
      <p className="phase-label">{phase.label}</p>
      <p className="cycle-count">{cycleIdx + 1} / {technique.cycles}</p>
      <button className="stop-btn" onClick={onStop}>stop</button>
    </div>
  )
}
