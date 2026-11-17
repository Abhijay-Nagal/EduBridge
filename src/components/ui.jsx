import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { XIcon } from './Icons'
import { useCountUp } from '../hooks/useCountUp'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="animate-page-in mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink/65">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="card animate-pop flex flex-col items-center gap-1 py-8 text-center">
      {Icon && (
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-md border-2 border-ink bg-brand-300 text-ink">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <p className="font-display text-lg font-extrabold text-ink">{title}</p>
      {hint && <p className="max-w-xs text-sm text-ink/65">{hint}</p>}
    </div>
  )
}

const toneClasses = {
  green: 'bg-lime text-ink',
  red: 'bg-bubble text-ink',
  amber: 'bg-[#ffe27a] text-ink',
  blue: 'bg-brand-200 text-ink',
  slate: 'bg-white text-ink',
  brand: 'bg-brand-300 text-ink',
}

const surfaceClasses = {
  green: 'bg-lime',
  red: 'bg-bubble',
  amber: 'bg-[#ffe27a]',
  blue: 'bg-brand-200',
  slate: 'bg-white',
  brand: 'bg-brand-300',
}

export function Badge({ tone = 'slate', children, className = '' }) {
  return <span className={`chip ${toneClasses[tone]} ${className}`}>{children}</span>
}

// Pulls the digits out of values like "92%" or "₹2,500" so they can be
// counted up while the surrounding characters stay put.
function AnimatedValue({ value }) {
  const isNumber = typeof value === 'number'
  const match = isNumber ? null : String(value).match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/)

  const prefix = isNumber ? '' : (match?.[1] ?? '')
  const suffix = isNumber ? '' : (match?.[3] ?? '')
  const target = isNumber
    ? value
    : match
      ? Number(match[2].replace(/,/g, ''))
      : NaN

  // Called unconditionally: the hook order must not depend on the value shape.
  const n = useCountUp(Number.isFinite(target) ? target : 0)

  if (!isNumber && !match) return <>{value}</>

  return (
    <>
      {prefix}
      {Math.round(n).toLocaleString('en-IN')}
      {suffix}
    </>
  )
}

export function StatCard({ label, value, sub, tone = 'brand', icon: Icon }) {
  return (
    <div className={`card ${surfaceClasses[tone]} transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_#231a24]`}>
      <div className="flex items-start justify-between">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/70">{label}</p>
        {Icon && <Icon className="h-5 w-5 text-ink" />}
      </div>
      <p className="mt-2 font-display text-4xl font-extrabold leading-none tracking-tight text-ink">
        <AnimatedValue value={value} />
      </p>
      {sub && <p className="mt-2 text-xs font-medium text-ink/70">{sub}</p>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  // Portalled to <body>: the page wrapper animates with a transform, which would
  // otherwise trap this fixed overlay inside the content column, under the nav bar.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/50"
        style={{ animation: 'page-in 0.2s ease-out both' }}
        onClick={onClose}
      />
      <div className="safe-bottom animate-slide-up relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-lg border-2 border-ink bg-cream p-5 shadow-pop sm:rounded-lg">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md border-2 border-ink bg-white p-1.5 text-ink transition hover:bg-lime"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [message, onDone])

  if (!message) return null
  return (
    <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-36 z-50 flex justify-center px-4">
      <div className="animate-pop flex items-center gap-2 rounded-md border-2 border-ink bg-lime px-4 py-2.5 text-sm font-bold text-ink shadow-pop-sm">
        {message}
      </div>
    </div>
  )
}

export function useToast() {
  const [message, setMessage] = useState('')
  return {
    message,
    show: setMessage,
    clear: () => setMessage(''),
  }
}

export function ProgressBar({ value, tone = 'brand' }) {
  const animated = useCountUp(Math.min(100, Math.max(0, value)), 1000)
  const bar = {
    brand: 'bg-brand-500',
    green: 'bg-lime',
    amber: 'bg-[#ffe27a]',
    red: 'bg-bubble',
  }[tone]

  return (
    <div className="h-3.5 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
      <div className={`h-full border-r-2 border-ink ${bar}`} style={{ width: `${animated}%` }} />
    </div>
  )
}

// Circular progress used for headline percentages.
export function ProgressRing({ value, size = 92, stroke = 9, tone = 'brand', children }) {
  const clamped = Math.min(100, Math.max(0, value))
  const animated = useCountUp(clamped, 1100)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const color = {
    brand: '#8f6bd0',
    green: '#9fc41a',
    amber: '#f0b400',
    red: '#e0559f',
  }[tone]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#efe3d6" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={circ}
          strokeDashoffset={circ - (animated / 100) * circ}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="card space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-2 w-full" />
    </div>
  )
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`whitespace-nowrap rounded-md border-2 px-4 py-2 text-sm font-bold transition-all duration-150 active:translate-x-px active:translate-y-px ${
            value === opt.value
              ? 'border-ink bg-lime text-ink shadow-pop-sm'
              : 'border-ink/25 bg-white text-ink/70 hover:border-ink hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatDateShort = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

export const formatRelative = (value) => {
  const diff = Date.now() - new Date(value).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateShort(value)
}

export const formatRupees = (n) => `₹${n.toLocaleString('en-IN')}`
