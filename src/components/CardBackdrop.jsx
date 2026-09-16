// Animated interior for a card: study symbols drifting and rising through it,
// over a tinted corner wash.
//
// Sits at z-index -1 inside any `.card` (which sets `isolation: isolate`), so
// it paints in front of the card's own background but behind its content, with
// no wrapping of the content required.
//
// Motion is transform and opacity only, so the browser composites it on the GPU
// instead of repainting the card each frame.

// Instruments are drawn rather than taken from emoji, so they inherit the
// card's tint and stay flat line art at low opacity.
const ICONS = {
  pencil: 'M3 21l1-4L16 5l3 3L7 20l-4 1Z M14 7l3 3',
  ruler: 'M3 14 14 3l7 7L10 21 3 14Z M7 10l2 2 M10 7l2 2 M13 4l2 2',
  compass: 'M12 3v5 M12 8 6 21 M12 8l6 13 M9.5 15h5',
  flask: 'M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3L15 9V3 M8 3h8 M7 15h10',
  // Nucleus plus two orbits crossed at 45 degrees, so it reads as an atom
  // rather than a disc.
  atom:
    'M12 12m-1.7 0a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0-3.4 0 ' +
    'M5.3 5.3A9.5 3.8 45 1 1 18.7 18.7A9.5 3.8 45 1 1 5.3 5.3 ' +
    'M5.3 18.7A9.5 3.8 -45 1 1 18.7 5.3A9.5 3.8 -45 1 1 5.3 18.7',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z M19 19v2H6a2 2 0 0 1-2-2',
  bulb: 'M9 18h6 M10 21h4 M12 3a6 6 0 0 0-4 10.5c.7.8 1 1.5 1 2.5h6c0-1 .3-1.7 1-2.5A6 6 0 0 0 12 3Z',
  triangle: 'M4 20h16L4 4v16Z M4 14h5 M9 20v-5',
  microscope: 'M9 4h4v7H9z M11 11v4 M6 21h12 M8 15h6a4 4 0 0 1-6 4',
  clip: 'M16 6 8.5 13.5a3 3 0 0 0 4 4L20 10a5 5 0 0 0-7-7L5 11a7 7 0 0 0 10 10l6-6',
}

const isIcon = (s) => Object.prototype.hasOwnProperty.call(ICONS, s)

// Symbol vocabularies. Greek letters and operators render from the text font;
// named entries come from ICONS above.
const SETS = {
  maths: ['π', '∑', '√', '∞', 'Δ', 'θ', '∫', '≈', '∠', '±', 'ruler', 'compass', 'triangle'],
  greek: ['α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'σ', 'φ', 'ψ', 'ω', 'Ω', 'Σ', 'Φ', 'Ψ'],
  science: ['λ', 'Ω', 'μ', '∂', '∇', 'α', 'β', '°', 'flask', 'atom', 'microscope'],
  book: ['✎', '§', '¶', 'pencil', 'book', 'clip', 'bulb'],
  money: ['₹', '%', '∑', 'book', 'clip'],
  people: ['✓', 'Σ', 'θ', 'book', 'pencil'],
  mixed: ['π', 'Ω', '√', 'θ', 'bulb', 'pencil', 'atom', '∑'],
}

// Fixed slots rather than Math.random(), so symbols never jump between renders
// and every card looks deliberately composed. `seed` rotates the assignment so
// neighbouring cards do not match.
const SLOTS = [
  { x: 9, y: 20, size: 21, dur: 11, dx: 17, dy: -19, rot: -18, o: 0.17, mode: 'drift' },
  { x: 74, y: 12, size: 16, dur: 13, dx: -15, dy: 21, rot: 22, o: 0.15, mode: 'drift' },
  { x: 43, y: 68, size: 25, dur: 15, dx: 19, dy: -15, rot: -12, o: 0.12, mode: 'rise' },
  { x: 86, y: 54, size: 18, dur: 12, dx: -17, dy: -17, rot: 20, o: 0.16, mode: 'drift' },
  { x: 21, y: 82, size: 15, dur: 16, dx: 13, dy: -23, rot: -24, o: 0.15, mode: 'rise' },
  { x: 60, y: 38, size: 20, dur: 14, dx: -13, dy: 17, rot: 14, o: 0.13, mode: 'drift' },
]

const TONE = {
  brand: { ink: 'text-brand-500', wash: 'bg-brand-400/20' },
  green: { ink: 'text-emerald-500', wash: 'bg-emerald-400/20' },
  amber: { ink: 'text-amber-500', wash: 'bg-amber-400/20' },
  red: { ink: 'text-rose-500', wash: 'bg-rose-400/20' },
  blue: { ink: 'text-sky-500', wash: 'bg-sky-400/20' },
  violet: { ink: 'text-violet-500', wash: 'bg-violet-400/20' },
}

export default function CardBackdrop({
  tone = 'brand',
  symbols = 'mixed',
  count = 4,
  seed = 0,
  wash = true,
  grid = false,
}) {
  const t = TONE[tone] ?? TONE.brand
  const set = SETS[symbols] ?? SETS.mixed
  const slots = SLOTS.slice(0, Math.min(count, SLOTS.length))

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      {grid && (
        <div
          className="pattern-pan absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.09) 1px, transparent 1px)',
            backgroundSize: '17px 17px',
          }}
        />
      )}

      {wash && (
        <div
          className={`halo absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${t.wash}`}
          style={{ animationDelay: `${(seed % 4) * -0.9}s` }}
        />
      )}

      {slots.map((s, i) => {
        const symbol = set[(i + seed) % set.length]
        const style = {
          left: `${s.x}%`,
          [s.mode === 'rise' ? 'bottom' : 'top']: s.mode === 'rise' ? 0 : `${s.y}%`,
          '--dx': `${s.dx}px`,
          '--dy': `${s.dy}px`,
          '--dur': `${s.dur}s`,
          '--rot': `${s.rot}deg`,
          '--o': s.o,
          '--delay': `${i * -2.6}s`,
        }
        const cls = `${s.mode === 'rise' ? 'float-rise' : 'float-drift'} absolute ${t.ink}`

        return isIcon(symbol) ? (
          <svg
            key={i}
            className={cls}
            style={style}
            width={s.size}
            height={s.size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICONS[symbol]} />
          </svg>
        ) : (
          <span
            key={i}
            className={`${cls} font-bold leading-none`}
            style={{ ...style, fontSize: s.size }}
          >
            {symbol}
          </span>
        )
      })}
    </div>
  )
}
