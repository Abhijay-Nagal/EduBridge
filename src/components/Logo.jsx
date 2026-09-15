import { useId } from 'react'

// The mark is a bridge span with a mortarboard at its apex: the "bridge"
// between the three groups of users, and the education it carries.
// `animated` draws the arch on, then drops the cap in.
export function LogoMark({ size = 48, animated = false, className = '' }) {
  const uid = useId().replace(/:/g, '')
  const g = `lg-${uid}`
  const s = `ls-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="EduBridge"
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="55%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill={`url(#${g})`} />
      <rect width="64" height="64" rx="16" fill={`url(#${s})`} />

      {/* Arch span */}
      <path
        d="M13 44 C13 27 51 27 51 44"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.2"
        strokeLinecap="round"
        className={animated ? 'logo-draw' : undefined}
        style={animated ? { '--len': 70 } : undefined}
      />

      {/* Deck and pillars */}
      <path
        d="M10 45.5 H54"
        stroke="#ffffff"
        strokeWidth="4.2"
        strokeLinecap="round"
        className={animated ? 'logo-draw' : undefined}
        style={animated ? { '--len': 44, animationDelay: '0.5s' } : undefined}
      />
      <g
        fill="#ffffff"
        opacity="0.92"
        className={animated ? 'animate-pop' : undefined}
        style={animated ? { animationDelay: '0.9s' } : undefined}
      >
        <rect x="17.5" y="45" width="4" height="9" rx="2" />
        <rect x="42.5" y="45" width="4" height="9" rx="2" />
      </g>

      {/* Mortarboard at the apex */}
      <g
        className={animated ? 'animate-pop' : undefined}
        style={animated ? { animationDelay: '1.05s' } : undefined}
      >
        <path d="M32 14 L45 20 L32 26 L19 20 Z" fill="#ffffff" />
        <path
          d="M26 23 V28.5 C26 31.5 38 31.5 38 28.5 V23"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="45" cy="26" r="2.4" fill="#fbbf24" />
        <path d="M45 20 V24" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </svg>
  )
}

export default function Logo({ size = 40, variant = 'dark', animated = false, showTagline = false }) {
  const onDark = variant === 'light'

  return (
    <div className="flex items-center gap-3">
      <LogoMark size={size} animated={animated} />
      <div className="leading-none">
        <p
          className="font-extrabold tracking-tight"
          style={{ fontSize: size * 0.62 }}
        >
          <span className={onDark ? 'text-white' : 'text-slate-900'}>Edu</span>
          <span
            className={
              onDark
                ? 'text-brand-200'
                : 'bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent'
            }
          >
            Bridge
          </span>
        </p>
        {showTagline && (
          <p
            className={`mt-1.5 font-semibold tracking-wide ${
              onDark ? 'text-white/60' : 'text-slate-400'
            }`}
            style={{ fontSize: Math.max(9, size * 0.2) }}
          >
            LEARNING, CONNECTED
          </p>
        )}
      </div>
    </div>
  )
}
