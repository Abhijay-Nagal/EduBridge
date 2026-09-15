import { useEffect, useRef, useState } from 'react'

const easeOut = (t) => 1 - Math.pow(1 - t, 3)

// Counts from zero up to `value` once on mount. Returns the target immediately
// when the user has asked for reduced motion.
export function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? value
      : 0,
  )
  const frame = useRef()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value)
      return
    }
    if (!Number.isFinite(value)) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    const from = 0

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setDisplay(from + (value - from) * easeOut(t))
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => frame.current && cancelAnimationFrame(frame.current)
  }, [value, duration])

  return display
}
