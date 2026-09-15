import { useEffect, useId, useRef, useState } from 'react'

// Fen, the EduBridge mascot: a fennec fox drawn as a layered SVG so each part
// can be animated on its own. The idle loops (breathing, blinking, ear twitch,
// tail sway) live in index.css under the `.m-*` classes; this component only
// decides which parts are on screen and where the pupils point.
//
// moods:
//   idle   arms down, open smile
//   wave   right arm raised and waving
//   cheer  both arms up, bouncing, sparkles
//   think  paw to chin, brows up, eyes glance upward
//   sleep  eyes closed, zzz

const FUR_L = '#FBEAD0'
const FUR_M = '#F0D3A6'
const FUR_D = '#DFB784'
const INK = '#2B2535'

export default function Mascot({
  size = 160,
  mood = 'idle',
  lookAt = false,
  interactive = false,
  greet = false,
  onPoke,
  className = '',
  style,
}) {
  const uid = useId().replace(/:/g, '')
  const id = (n) => `${n}-${uid}`
  const wrapRef = useRef(null)
  const [pupil, setPupil] = useState({ x: 0, y: 0 })

  // Randomise the blink phase so two mascots on one screen never blink together.
  const blinkDelay = useRef(`${-(Math.random() * 5).toFixed(2)}s`)

  // Big gestures are one-shot bursts layered over the resting pose, so the
  // character is calm unless something actually happened.
  // `greet` may be true (wave) or a specific gesture name.
  const [burst, setBurst] = useState(greet ? (typeof greet === 'string' ? greet : 'wave') : null)
  const burstTimer = useRef()

  useEffect(() => {
    if (!greet) return
    setBurst(typeof greet === 'string' ? greet : 'wave')
    const t = setTimeout(() => setBurst(null), 2600)
    return () => clearTimeout(t)
  }, [greet])

  useEffect(() => () => clearTimeout(burstTimer.current), [])

  const poke = () => {
    if (!interactive) return
    clearTimeout(burstTimer.current)
    const next = Math.random() > 0.55 ? 'cheer' : 'wave'
    setBurst(next)
    burstTimer.current = setTimeout(() => setBurst(null), 2400)
    onPoke?.(next)
  }

  const active = burst ?? mood
  const sleeping = active === 'sleep'
  const thinking = active === 'think'
  const cheering = active === 'cheer'
  const waving = active === 'wave'

  useEffect(() => {
    if (!lookAt || sleeping) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (e) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const el = wrapRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height * 0.42
        const dx = (e.clientX - cx) / Math.max(180, r.width * 2)
        const dy = (e.clientY - cy) / Math.max(180, r.height * 2)
        const clamp = (v) => Math.max(-1, Math.min(1, v))
        setPupil({ x: clamp(dx) * 3.4, y: clamp(dy) * 2.6 })
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [lookAt, sleeping])

  // A glance upward reads as "working something out".
  const gaze = thinking ? { x: 1.6, y: -3 } : pupil

  return (
    <div
      ref={wrapRef}
      className={`mascot select-none ${interactive ? 'mascot-poke' : ''} ${className}`}
      style={style}
      onPointerDown={interactive ? poke : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? 'Poke the mascot' : undefined}
      aria-hidden={interactive ? undefined : 'true'}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                poke()
              }
            }
          : undefined
      }
    >
      <svg width={size} height={size * (220 / 200)} viewBox="0 0 200 220">
        <defs>
          <linearGradient id={id('furHead')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#FEF3E2" />
            <stop offset="100%" stopColor={FUR_M} />
          </linearGradient>
          <linearGradient id={id('furBody')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={FUR_L} />
            <stop offset="100%" stopColor="#EACB9C" />
          </linearGradient>
          <linearGradient id={id('ear')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>
          <linearGradient id={id('cape')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>
          <linearGradient id={id('tail')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <radialGradient id={id('iris')} cx="0.38" cy="0.32" r="0.78">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="60%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#3B1E86" />
          </radialGradient>

          <clipPath id={id('clipL')}>
            <ellipse cx="82" cy="90" rx="13" ry="14" />
          </clipPath>
          <clipPath id={id('clipR')}>
            <ellipse cx="118" cy="90" rx="13" ry="14" />
          </clipPath>
        </defs>

        <g className={cheering ? 'm-root m-bounce' : 'm-root'}>
          {/* ---------- cape, behind everything ---------- */}
          <path
            d="M78 124 C56 144 50 180 60 206 L86 198 C72 172 72 144 88 128 Z"
            fill={`url(#${id('cape')})`}
          />
          <path
            d="M122 126 C138 140 143 162 139 178 L127 169 C129 152 127 138 118 130 Z"
            fill={`url(#${id('cape')})`}
            opacity="0.75"
          />

          {/* ---------- tail, drawn over the cape so it stays readable ---------- */}
          <g className="m-tail">
            <path
              d="M80 172 C56 174 34 188 24 204 C21 212 30 218 39 215 C56 209 74 195 82 182 Z"
              fill={FUR_M}
            />
            <path
              d="M27 199 C22 207 30 218 39 215 C46 212 52 207 56 201 C46 204 34 202 27 199 Z"
              fill={`url(#${id('tail')})`}
            />
          </g>

          {/* ---------- body ---------- */}
          <g className="m-body">
            <ellipse cx="84" cy="206" rx="12" ry="8" fill={FUR_M} />
            <ellipse cx="116" cy="206" rx="12" ry="8" fill={FUR_M} />
            <path d="M79 206 h10 M111 206 h10" stroke={FUR_D} strokeWidth="1.2" strokeLinecap="round" />

            <ellipse cx="100" cy="160" rx="37" ry="42" fill={`url(#${id('furBody')})`} />
            <ellipse cx="100" cy="168" rx="25" ry="31" fill="#FEF6E7" />

            {/* Resting left arm. The cheering variant is drawn after the head. */}
            {!cheering && (
              <g className="m-arm-idle-l">
                <path
                  d="M72 140 C62 148 58 164 62 174 C68 177 74 168 76 156 Z"
                  fill={FUR_M}
                />
                <ellipse cx="64" cy="175" rx="8" ry="7" fill={FUR_L} />
              </g>
            )}

            {/* Resting right arm. The raised variants are drawn after the head
                so they are not hidden behind it. */}
            {!waving && !cheering && !thinking && (
              <g>
                <path
                  d="M128 140 C138 148 142 164 138 174 C132 177 126 168 124 156 Z"
                  fill={FUR_M}
                />
                <ellipse cx="136" cy="175" rx="8" ry="7" fill={FUR_L} />
              </g>
            )}

            {/* scarf and badge, drawn over the chest */}
            <path
              d="M72 120 Q100 142 128 120 Q126 133 100 136 Q74 133 72 120 Z"
              fill={`url(#${id('cape')})`}
            />
            <circle cx="113" cy="129" r="4.2" fill="#F59E0B" />
            <circle cx="112" cy="127.6" r="1.4" fill="#FDE68A" />

            <path d="M100 139 L111 150 L100 161 L89 150 Z" fill="#EDE9FE" stroke="#6D28D9" strokeWidth="1.6" />
            <path
              d="M95.6 148.6 C94.2 146.6 96.2 144.6 98.2 145.6 C99.2 143.8 103 144.2 103.4 146.6 C105.4 147.2 105.4 150.4 103.4 151.4 C102.9 153.8 99 154.4 97.6 152.5 C95.2 152.5 94.6 150.1 95.6 148.6 Z"
              fill="none"
              stroke="#6D28D9"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M100 145.4 V153.2" stroke="#6D28D9" strokeWidth="1.1" strokeLinecap="round" />
          </g>

          {/* ---------- head ---------- */}
          <g className="m-head">
            {/* ears behind the skull */}
            {/* Fennec ears: broad at the base and swept outward, not upright. */}
            <g className="m-ear-l">
              <path d="M66 62 C38 48 20 20 33 9 C48 2 78 25 90 52 Z" fill={`url(#${id('furHead')})`} />
              <path d="M66 57 C44 46 30 23 39 16 C51 11 74 32 84 51 Z" fill={`url(#${id('ear')})`} />
              <path d="M64 53 C48 44 38 27 44 22 C52 20 68 36 78 50 Z" fill="#8B5CF6" opacity="0.4" />
            </g>
            <g className="m-ear-r">
              <path d="M134 62 C162 48 180 20 167 9 C152 2 122 25 110 52 Z" fill={`url(#${id('furHead')})`} />
              <path d="M134 57 C156 46 170 23 161 16 C149 11 126 32 116 51 Z" fill={`url(#${id('ear')})`} />
              <path d="M136 53 C152 44 162 27 156 22 C148 20 132 36 122 50 Z" fill="#8B5CF6" opacity="0.4" />
            </g>

            {/* tufts between the ears */}
            <path d="M88 52 L95 39 L101 53 Z" fill={FUR_L} />
            <path d="M99 53 L106 40 L112 52 Z" fill={FUR_L} />

            <ellipse cx="100" cy="86" rx="45" ry="40" fill={`url(#${id('furHead')})`} />
            <ellipse cx="100" cy="68" rx="27" ry="12" fill="#FFFFFF" opacity="0.3" />

            {/* cheek fluff */}
            <path d="M57 80 C48 78 45 88 52 92 C46 96 51 104 59 101 Z" fill={FUR_L} />
            <path d="M143 80 C152 78 155 88 148 92 C154 96 149 104 141 101 Z" fill={FUR_L} />

            {/* brows */}
            <path
              d={thinking ? 'M69 68 Q80 62 92 67' : 'M70 72 Q80 67 92 71'}
              fill="none"
              stroke={FUR_D}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d={thinking ? 'M108 67 Q120 62 131 68' : 'M108 71 Q120 67 130 72'}
              fill="none"
              stroke={FUR_D}
              strokeWidth="2.6"
              strokeLinecap="round"
            />

            {/* eyes */}
            {sleeping ? (
              <>
                <path d="M71 92 Q82 100 93 92" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
                <path d="M107 92 Q118 100 129 92" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
              </>
            ) : (
              <>
                <g>
                  <ellipse cx="82" cy="90" rx="13" ry="14" fill="#FFFFFF" />
                  <g transform={`translate(${gaze.x} ${gaze.y})`}>
                    <circle cx="82" cy="91" r="10" fill={`url(#${id('iris')})`} />
                    <circle cx="82" cy="91.5" r="4.8" fill="#170F2B" />
                    <circle cx="78.2" cy="86.6" r="3.3" fill="#FFFFFF" />
                    <circle cx="86.2" cy="96" r="1.7" fill="#FFFFFF" opacity="0.85" />
                  </g>
                  <g clipPath={`url(#${id('clipL')})`}>
                    <rect
                      className="m-lid"
                      x="68"
                      y="75"
                      width="28"
                      height="30"
                      fill={FUR_M}
                      style={{ animationDelay: blinkDelay.current }}
                    />
                  </g>
                  <ellipse cx="82" cy="90" rx="13" ry="14" fill="none" stroke={FUR_D} strokeWidth="1.1" />
                </g>

                <g>
                  <ellipse cx="118" cy="90" rx="13" ry="14" fill="#FFFFFF" />
                  <g transform={`translate(${gaze.x} ${gaze.y})`}>
                    <circle cx="118" cy="91" r="10" fill={`url(#${id('iris')})`} />
                    <circle cx="118" cy="91.5" r="4.8" fill="#170F2B" />
                    <circle cx="114.2" cy="86.6" r="3.3" fill="#FFFFFF" />
                    <circle cx="122.2" cy="96" r="1.7" fill="#FFFFFF" opacity="0.85" />
                  </g>
                  <g clipPath={`url(#${id('clipR')})`}>
                    <rect
                      className="m-lid"
                      x="104"
                      y="75"
                      width="28"
                      height="30"
                      fill={FUR_M}
                      style={{ animationDelay: blinkDelay.current }}
                    />
                  </g>
                  <ellipse cx="118" cy="90" rx="13" ry="14" fill="none" stroke={FUR_D} strokeWidth="1.1" />
                </g>
              </>
            )}

            {/* muzzle, nose, mouth. The nose sits clear of the mouth so the
                two do not merge into a single dark shape. */}
            <ellipse cx="100" cy="108" rx="17" ry="12.5" fill="#FEF6E7" />
            <ellipse cx="100" cy="100.5" rx="5.4" ry="4" fill={INK} />
            <ellipse cx="98.2" cy="99.2" rx="1.6" ry="1.1" fill="#FFFFFF" opacity="0.55" />
            <path d="M100 104.5 V107" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />

            {sleeping || thinking ? (
              <path
                d="M92 109 Q100 116 108 109"
                fill="none"
                stroke={INK}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path d="M91 108 C94 122 106 122 109 108 Z" fill="#B23A52" />
                <ellipse cx="100" cy="117.5" rx="4.8" ry="3.2" fill="#F0748C" />
              </>
            )}

            <circle cx="68" cy="102" r="7" fill="#F2A0AE" opacity="0.4" />
            <circle cx="132" cy="102" r="7" fill="#F2A0AE" opacity="0.4" />
          </g>

          {/* ---------- raised arms, in front of the head ---------- */}
          {cheering && (
            <g className="m-arm-cheer-l">
              <path
                d="M72 140 C62 128 55 112 53 102 C48 101 43 110 47 122 C51 133 60 146 66 149 Z"
                fill={FUR_M}
              />
              <circle cx="50" cy="98" r="9.5" fill={FUR_L} />
              <ellipse cx="50" cy="100" rx="4" ry="3.2" fill="#A78BFA" />
              <circle cx="45.5" cy="93.5" r="1.7" fill="#A78BFA" />
              <circle cx="50" cy="91.8" r="1.7" fill="#A78BFA" />
              <circle cx="54.5" cy="93.5" r="1.7" fill="#A78BFA" />
            </g>
          )}
          {(waving || cheering) && (
            <g className={waving ? 'm-arm-wave' : 'm-arm-cheer-r'}>
              <path
                d="M128 140 C138 128 145 112 147 102 C152 101 157 110 153 122 C149 133 140 146 134 149 Z"
                fill={FUR_M}
              />
              <circle cx="150" cy="98" r="9.5" fill={FUR_L} />
              <ellipse cx="150" cy="100" rx="4" ry="3.2" fill="#A78BFA" />
              <circle cx="145.5" cy="93.5" r="1.7" fill="#A78BFA" />
              <circle cx="150" cy="91.8" r="1.7" fill="#A78BFA" />
              <circle cx="154.5" cy="93.5" r="1.7" fill="#A78BFA" />
            </g>
          )}
          {thinking && (
            <g>
              <path d="M126 142 C136 136 139 124 131 118 C124 115 118 122 120 130 Z" fill={FUR_M} />
              <circle cx="125" cy="114" r="8.5" fill={FUR_L} />
              <ellipse cx="125" cy="116" rx="3.6" ry="2.9" fill="#A78BFA" />
            </g>
          )}

          {/* ---------- mood extras ---------- */}
          {cheering && (
            <g fill="#FBBF24">
              <path className="m-sparkle" style={{ animationDelay: '0s' }} d="M34 74 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" />
              <path className="m-sparkle" style={{ animationDelay: '0.5s' }} d="M168 60 l2.2 5.4 5.4 2.2 -5.4 2.2 -2.2 5.4 -2.2 -5.4 -5.4 -2.2 5.4 -2.2 Z" />
              <path className="m-sparkle" style={{ animationDelay: '1s' }} d="M162 128 l1.8 4.4 4.4 1.8 -4.4 1.8 -1.8 4.4 -1.8 -4.4 -4.4 -1.8 4.4 -1.8 Z" />
            </g>
          )}

          {sleeping && (
            <g fill="#94A3B8" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
              <text className="m-zzz" style={{ animationDelay: '0s' }} x="140" y="56" fontSize="15">
                z
              </text>
              <text className="m-zzz" style={{ animationDelay: '0.9s' }} x="148" y="44" fontSize="12">
                z
              </text>
              <text className="m-zzz" style={{ animationDelay: '1.8s' }} x="156" y="34" fontSize="9">
                z
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}

// Mascot that talks: cycles through `lines`, briefly showing a typing
// indicator before each one, and jumps to a random line when poked.
export function MascotBuddy({
  lines = [],
  size = 96,
  mood = 'idle',
  tone = 'light',
  interval = 5400,
  greet = false,
  className = '',
}) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [typing, setTyping] = useState(true)
  const dark = tone === 'dark'

  // Short typing beat at the start of every line.
  useEffect(() => {
    setTyping(true)
    const t = setTimeout(() => setTyping(false), 520)
    return () => clearTimeout(t)
  }, [index])

  // Hide, advance, show again. Re-runs on each index change to form the loop.
  useEffect(() => {
    if (lines.length <= 1) return
    const hide = setTimeout(() => setVisible(false), interval - 600)
    const next = setTimeout(() => {
      setIndex((v) => (v + 1) % lines.length)
      setVisible(true)
    }, interval)
    return () => {
      clearTimeout(hide)
      clearTimeout(next)
    }
  }, [index, lines.length, interval])

  const jump = () => {
    if (lines.length <= 1) return
    setIndex((v) => (v + 1) % lines.length)
    setVisible(true)
  }

  if (lines.length === 0) return null

  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascot
        size={size}
        mood={mood}
        lookAt
        interactive
        greet={greet}
        onPoke={jump}
        className="shrink-0"
      />
      <div
        key={index}
        className={`bubble-bob relative mb-3 min-w-0 flex-1 ${
          visible ? 'bubble-in' : 'bubble-out'
        }`}
      >
        <div
          className={`relative rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-snug shadow-sm ${
            dark ? 'bg-white/15 text-white backdrop-blur' : 'bg-white text-slate-700 ring-1 ring-slate-900/5'
          }`}
        >
          <span
            className={`absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 ${
              dark ? 'bg-white/15' : 'bg-white ring-1 ring-slate-900/5'
            }`}
          />
          <span className="relative block">
            {typing ? (
              <span className="dot-typing inline-flex items-center gap-1 py-1">
                <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white' : 'bg-slate-400'}`} />
                <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white' : 'bg-slate-400'}`} />
                <span className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-white' : 'bg-slate-400'}`} />
              </span>
            ) : (
              lines[index]
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

// Static single-line variant, for one-off contextual nudges.
export function MascotSays({
  children,
  mood = 'idle',
  size = 92,
  lookAt = true,
  tone = 'light',
  className = '',
}) {
  const dark = tone === 'dark'
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <Mascot size={size} mood={mood} lookAt={lookAt} interactive className="shrink-0" />
      <div
        className={`animate-pop bubble-bob relative mb-3 flex-1 rounded-2xl px-3.5 py-2.5 text-sm font-medium leading-snug shadow-sm ${
          dark ? 'bg-white/15 text-white backdrop-blur' : 'bg-white text-slate-700 ring-1 ring-slate-900/5'
        }`}
      >
        <span
          className={`absolute -left-1.5 bottom-3 h-3 w-3 rotate-45 ${
            dark ? 'bg-white/15' : 'bg-white ring-1 ring-slate-900/5'
          }`}
        />
        <span className="relative">{children}</span>
      </div>
    </div>
  )
}
