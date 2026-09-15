// Animated interior for a card: a drifting particle field, optional subject
// glyphs rising through it, and a tinted corner wash.
//
// Sits at z-index -1 inside any `.card` (which sets `isolation: isolate`), so
// it paints in front of the card's own background but behind its content, with
// no wrapping of the content required.
//
// Everything is transform and opacity only, so the browser composites it on
// the GPU instead of repainting the card each frame.

// Fixed layouts rather than Math.random(), so positions never jump between
// renders and every card looks deliberately composed. `seed` rotates the list
// so neighbouring cards do not match.
const MOTES = [
  { x: 14, y: 26, size: 6, dx: 16, dy: -18, dur: 19, o: 0.34 },
  { x: 72, y: 16, size: 4, dx: -13, dy: 20, dur: 24, o: 0.28 },
  { x: 41, y: 72, size: 8, dx: 18, dy: -12, dur: 27, o: 0.22 },
  { x: 88, y: 58, size: 5, dx: -16, dy: -16, dur: 21, o: 0.3 },
  { x: 24, y: 88, size: 3.5, dx: 12, dy: -22, dur: 30, o: 0.26 },
  { x: 60, y: 44, size: 5.5, dx: -10, dy: 16, dur: 23, o: 0.2 },
]

const GLYPH_SETS = {
  maths: ['π', '∑', '√', '∞', 'Δ', 'θ'],
  science: ['⚛', 'λ', 'Ω', 'μ', '∂'],
  book: ['✎', '§', '¶', '✦'],
  money: ['₹'],
  people: ['✦', '●'],
}

const TONE = {
  brand: { mote: 'bg-brand-400', glyph: 'text-brand-500', wash: 'bg-brand-400/20' },
  green: { mote: 'bg-emerald-400', glyph: 'text-emerald-500', wash: 'bg-emerald-400/20' },
  amber: { mote: 'bg-amber-400', glyph: 'text-amber-500', wash: 'bg-amber-400/20' },
  red: { mote: 'bg-rose-400', glyph: 'text-rose-500', wash: 'bg-rose-400/20' },
  blue: { mote: 'bg-sky-400', glyph: 'text-sky-500', wash: 'bg-sky-400/20' },
  violet: { mote: 'bg-violet-400', glyph: 'text-violet-500', wash: 'bg-violet-400/20' },
}

const rotate = (arr, by) => arr.map((_, i) => arr[(i + by) % arr.length])

export default function CardBackdrop({
  tone = 'brand',
  glyphs = null,
  motes = 4,
  seed = 0,
  wash = true,
  grid = false,
  glyphCount = 3,
}) {
  const t = TONE[tone] ?? TONE.brand
  const picked = rotate(MOTES, seed % MOTES.length).slice(0, Math.min(motes, MOTES.length))
  // Capped: a dashboard can hold a dozen of these, and every glyph is its own
  // animated element.
  const glyphList = glyphs ? rotate(GLYPH_SETS[glyphs] ?? [], seed).slice(0, glyphCount) : []

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-[1] overflow-hidden rounded-[inherit]"
      aria-hidden="true"
    >
      {/* denser graph paper for cards that want more texture */}
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

      {/* corner wash */}
      {wash && (
        <div
          className={`halo absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${t.wash}`}
          style={{ animationDelay: `${(seed % 4) * -0.9}s` }}
        />
      )}

      {/* drifting motes */}
      {picked.map((m, i) => (
        <span
          key={i}
          className={`mote absolute rounded-full ${t.mote}`}
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            '--dx': `${m.dx}px`,
            '--dy': `${m.dy}px`,
            '--dur': `${m.dur}s`,
            '--o': m.o,
            '--delay': `${i * -2.4}s`,
          }}
        />
      ))}

      {/* subject glyphs rising through the card */}
      {glyphList.map((g, i) => (
        <span
          key={g + i}
          className={`glyph-rise absolute font-bold ${t.glyph}`}
          style={{
            left: `${8 + ((i * 23 + seed * 11) % 80)}%`,
            bottom: 0,
            fontSize: 13 + ((i + seed) % 3) * 6,
            '--dur': `${22 + ((i * 5 + seed * 3) % 14)}s`,
            '--delay': `${i * -5.5}s`,
            '--dx': `${(i % 2 ? 1 : -1) * (6 + i * 3)}px`,
            '--rot': `${(i % 2 ? 1 : -1) * (14 + i * 6)}deg`,
            '--o': 0.14,
          }}
        >
          {g}
        </span>
      ))}
    </div>
  )
}
