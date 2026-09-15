// Ambient backdrop: a few large, heavily blurred colour fields drifting on long
// cycles, over a faint dot grid. Fixed and non-interactive, so it sits behind
// everything without affecting layout or taps.
//
// variant 'light' sits behind the app shell, 'dark' behind the brand gradient
// screens (intro, login).
export default function AnimatedBackground({ variant = 'light' }) {
  const dark = variant === 'dark'

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${
            dark ? 'rgba(255,255,255,0.12)' : 'rgba(79,70,229,0.13)'
          } 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 78%)',
        }}
      />

      {/* drifting colour fields */}
      <div
        className={`drift-a absolute -left-32 -top-24 h-[26rem] w-[26rem] rounded-full blur-3xl ${
          dark ? 'bg-brand-400/25' : 'bg-brand-400/20'
        }`}
      />
      <div
        className={`drift-b absolute -right-28 top-1/3 h-[22rem] w-[22rem] rounded-full blur-3xl ${
          dark ? 'bg-violet-400/20' : 'bg-violet-400/18'
        }`}
      />
      <div
        className={`drift-c absolute -bottom-32 left-1/4 h-[24rem] w-[24rem] rounded-full blur-3xl ${
          dark ? 'bg-sky-400/16' : 'bg-sky-400/16'
        }`}
      />
      <div
        className={`drift-b absolute -bottom-20 -right-20 h-[18rem] w-[18rem] rounded-full blur-3xl ${
          dark ? 'bg-fuchsia-400/14' : 'bg-fuchsia-400/14'
        }`}
        style={{ animationDelay: '-12s' }}
      />
    </div>
  )
}
