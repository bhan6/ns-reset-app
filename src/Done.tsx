import { useEffect, useRef } from 'react'

interface Props {
  onClose: () => void
  onBack: () => void
}

export default function Done({ onClose, onBack }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="done-screen">
      <p className="done-text">done. now carry forward</p>
      <button className="back-btn" onClick={onBack}>← another session</button>
    </div>
  )
}
