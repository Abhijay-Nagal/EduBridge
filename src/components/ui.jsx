import { useEffect, useState } from 'react'
import { XIcon } from './Icons'
import { useCountUp } from '../hooks/useCountUp'
import Mascot from './Mascot'
import CardBackdrop from './CardBackdrop'

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="animate-page-in mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, hint, mascot = true, mood = 'think' }) {
  return (
    <div className="card animate-pop flex flex-col items-center gap-1 py-8 text-center">
      <CardBackdrop tone="brand" symbols="book" count={5} grid />
      {mascot ? (
        <Mascot size={118} mood={mood} lookAt interactive />
      ) : (
        Icon && (
          <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon className="h-6 w-6" />
          </div>
        )
      )}
      <p className="font-semibold text-slate-700">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-500">{hint}</p>}
    </div>
  )
}

const toneClasses = {
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
  blue: 'bg-sky-50 text-sky-700',
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
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

export function StatCard({ label, value, sub, tone = 'brand', icon: Icon, symbols, seed = 0 }) {
  return (
    <div className="card group transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <CardBackdrop tone={tone} symbols={symbols} seed={seed} count={4} />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        {Icon && (
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${toneClasses[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="relative mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        <AnimatedValue value={value} />
      </p>
      {sub && <p className="relative mt-0.5 text-xs text-slate-500">{sub}</p>}
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        style={{ animation: 'page-in 0.2s ease-out both' }}
        onClick={onClose}
      />
      <div className="safe-bottom animate-slide-up relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:rotate-90 hover:bg-slate-100"
            aria-label="Close"
          >
            <XIcon />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex gap-2">{footer}</div>}
      </div>
    </div>
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
      <div className="animate-pop flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        <Mascot size={32} />
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
    brand: 'bg-gradient-to-r from-brand-500 to-brand-700',
    green: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
    amber: 'bg-gradient-to-r from-amber-400 to-amber-600',
    red: 'bg-gradient-to-r from-rose-400 to-rose-600',
  }[tone]

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${animated}%` }} />
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
    brand: '#4f46e5',
    green: '#059669',
    amber: '#d97706',
    red: '#e11d48',
  }[tone]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
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
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95 ${
            value === opt.value
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
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
