import { useEffect, useRef } from 'react'

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#38bdf8']

// One-shot canvas confetti. No dependency, no DOM churn, and it removes its own
// animation frame as soon as every piece has fallen out of view.
export default function Confetti({ count = 110, duration = 2600 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    let w = (canvas.width = canvas.offsetWidth * dpr)
    let h = (canvas.height = canvas.offsetHeight * dpr)

    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: -Math.random() * h * 0.4,
      vx: (Math.random() - 0.5) * 2.4 * dpr,
      vy: (1.6 + Math.random() * 2.6) * dpr,
      size: (4 + Math.random() * 5) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.24,
      color: COLORS[(Math.random() * COLORS.length) | 0],
      shape: Math.random() > 0.35 ? 'rect' : 'circle',
    }))

    let frame
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, w, h)

      let alive = false
      for (const p of pieces) {
        p.vy += 0.028 * dpr
        p.x += p.vx
        p.y += p.vy
        p.rot += p.vr

        if (p.y < h + 40 * dpr) alive = true

        const fade = elapsed > duration - 600 ? Math.max(0, (duration - elapsed) / 600) : 1
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (alive && elapsed < duration) {
        frame = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, w, h)
      }
    }
    frame = requestAnimationFrame(tick)

    const onResize = () => {
      w = canvas.width = canvas.offsetWidth * dpr
      h = canvas.height = canvas.offsetHeight * dpr
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [count, duration])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[90] h-full w-full"
      aria-hidden="true"
    />
  )
}
