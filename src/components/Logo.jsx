// Mark: a gate-shaped arch standing on a bridge deck, drawn with the same
// heavy ink outline and offset shadow as the rest of the interface.
export function LogoMark({ size = 40, animated = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="EduBridge"
      style={{ overflow: 'visible' }}
    >
      <rect x="7" y="7" width="54" height="54" rx="9" fill="#231a24" />
      <rect x="2" y="2" width="54" height="54" rx="9" fill="#c5b3e6" stroke="#231a24" strokeWidth="3.5" />
      <path
        d="M11 44 V33 C11 19 45 19 45 33 V44 Z"
        fill="#dcf75a"
        stroke="#231a24"
        strokeWidth="3.5"
        strokeLinejoin="round"
        className={animated ? 'animate-pop' : undefined}
      />
      <path d="M21 44 V35 C21 28 35 28 35 35 V44 Z" fill="#fff6ee" stroke="#231a24" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M6 44 H50" stroke="#231a24" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="43" cy="14" r="4.5" fill="#efa3dc" stroke="#231a24" strokeWidth="3" />
    </svg>
  )
}

export default function Logo({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span
        className="font-display font-extrabold leading-none tracking-tight text-ink"
        style={{ fontSize: size * 0.58 }}
      >
        edubridge
      </span>
    </div>
  )
}
