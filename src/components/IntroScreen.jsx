import { useEffect, useState } from 'react'
import { LogoMark } from './Logo'

// Short opening: the mark pops in, the wordmark follows, then the screen lifts.
export default function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onDone()
      return
    }
    const timers = [
      setTimeout(() => setPhase(1), 450),
      setTimeout(() => setLeaving(true), 1700),
      setTimeout(() => onDone(), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const skip = () => {
    setLeaving(true)
    setTimeout(onDone, 300)
  }

  return (
    <div
      onClick={skip}
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-brand-300 transition-all duration-500 ${
        leaving ? 'pointer-events-none -translate-y-8 opacity-0' : 'opacity-100'
      }`}
    >
      <div className="animate-pop">
        <LogoMark size={112} />
      </div>
      <h1
        className={`mt-8 font-display text-5xl font-extrabold tracking-tight text-ink transition-all duration-500 ${
          phase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        edubridge
      </h1>
    </div>
  )
}
