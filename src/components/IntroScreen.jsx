import { useEffect, useState } from 'react'
import Mascot from './Mascot'
import { LogoMark } from './Logo'

// Opening sequence: the mark draws itself, the wordmark resolves, then Fen
// climbs into frame and waves up at the logo before the whole thing lifts away.
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
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1250),
      setTimeout(() => setPhase(3), 1900),
      setTimeout(() => setLeaving(true), 3150),
      setTimeout(() => onDone(), 3650),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const skip = () => {
    setLeaving(true)
    setTimeout(onDone, 380)
  }

  return (
    <div
      onClick={skip}
      className={`fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-brand-700 via-brand-600 to-brand-900 transition-all duration-500 ${
        leaving ? 'pointer-events-none -translate-y-6 opacity-0' : 'opacity-100'
      }`}
    >
      {/* drifting background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="halo absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl" />
        <div
          className="halo absolute -right-16 bottom-16 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl"
          style={{ animationDelay: '1.2s' }}
        />
      </div>

      <div className="relative flex flex-col items-center px-6">
        {/* logo mark */}
        <div className="animate-pop relative">
          <div className="halo absolute inset-0 rounded-[28px] bg-white/25 blur-2xl" />
          <div className="relative rounded-[28px] shadow-2xl shadow-brand-950/40">
            <LogoMark size={104} animated />
          </div>
        </div>

        {/* wordmark */}
        <div
          className={`mt-6 text-center transition-all duration-700 ${
            phase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Edu<span className="text-brand-200">Bridge</span>
          </h1>
          <p
            className={`mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/55 transition-all duration-700 ${
              phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
          >
            Learning, connected
          </p>
        </div>

        {/* mascot rising into frame, waving up at the mark */}
        <div
          className={`mt-2 transition-all duration-[900ms] ease-out ${
            phase >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}
        >
          <Mascot size={160} mood={phase >= 3 ? 'wave' : 'idle'} />
        </div>

        <p
          className={`mt-1 text-xs font-medium text-white/45 transition-opacity duration-500 ${
            phase >= 3 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Tap to continue
        </p>
      </div>

      {/* loading rail */}
      <div className="absolute bottom-12 h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white/80 transition-all ease-out"
          style={{ width: `${Math.min(100, (phase + 1) * 26)}%`, transitionDuration: '650ms' }}
        />
      </div>
    </div>
  )
}
