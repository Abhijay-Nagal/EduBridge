import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Guided tour. Steps point at real navigation items via data-tour attributes,
// so every stop is a feature this role can actually open.
// "Seen" state lives in this browser only (localStorage), not on the account.

export const tourKey = (user) => `edubridge-tour-v1:${user.role}:${user.id}`

const STEPS = {
  student: [
    { target: '/student', title: 'Home', body: 'Attendance, latest marks and pending quizzes.' },
    { target: '/student/material', title: 'Material', body: 'Notes and files from your teachers, newest first.' },
    { target: '/student/quizzes', title: 'Quizzes', body: 'Attempt quizzes before the deadline and see your score.' },
    { target: '/student/progress', title: 'Progress', body: 'Marks by subject and term.' },
    { target: '/student/notifications', title: 'Alerts', body: 'Announcements from the institute.' },
  ],
  parent: [
    { target: '/parent', title: 'Home', body: "Your child's attendance, marks and fees at a glance." },
    { target: '/parent/attendance', title: 'Attendance', body: 'Every session, marked present, late or absent.' },
    { target: '/parent/progress', title: 'Progress', body: 'Marks by subject and term.' },
    { target: '/parent/fees', title: 'Fees', body: 'What is paid, what is due and when.' },
    { target: '/parent/notifications', title: 'Alerts', body: 'Announcements from the institute.' },
  ],
  admin: [
    { target: '/admin', title: 'Home', body: 'Fees, attendance and students who need attention.' },
    { target: '/admin/people', title: 'People', body: 'Add and manage students, parents and batches.' },
    { target: '/admin/attendance', title: 'Attendance', body: 'Mark a batch present, late or absent.' },
    { target: '/admin/content', title: 'Content', body: 'Upload material and create quizzes.' },
    { target: '/admin/fees', title: 'Fees', body: 'Record payments and track dues.' },
    { target: '/admin/notifications', title: 'Alerts', body: 'Send announcements to students and parents.' },
  ],
}

const REPLAY = {
  target: 'tour-help',
  title: 'Replay',
  body: 'Open this button any time to see the tour again.',
}

function findTarget(id) {
  const nodes = document.querySelectorAll(`[data-tour="${id}"]`)
  for (const n of nodes) {
    const r = n.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return n
  }
  return null
}

export default function Tour({ role, onClose }) {
  const steps = [...(STEPS[role] || []), REPLAY]
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null)
  const nextRef = useRef(null)
  const step = steps[i]
  const last = i === steps.length - 1

  const measure = useCallback(() => {
    const el = findTarget(step.target)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [step])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure])

  useEffect(() => {
    nextRef.current?.focus()
  }, [i])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (e.key === 'Enter') return
        last ? onClose() : setI((n) => n + 1)
      }
      if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last, onClose])

  const pad = 6
  const W = typeof window !== 'undefined' ? window.innerWidth : 360
  const H = typeof window !== 'undefined' ? window.innerHeight : 640
  const cardW = Math.min(320, W - 24)
  let cardStyle = { width: cardW, left: (W - cardW) / 2, top: H / 2 - 90 }
  if (rect) {
    const below = rect.top + rect.height / 2 < H / 2
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), W - cardW - 12)
    cardStyle = below
      ? { width: cardW, left, top: rect.bottom + pad + 14 }
      : { width: cardW, left, bottom: H - rect.top + pad + 14 }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="App tour">
      {/* blocks clicks behind the tour */}
      <div className="absolute inset-0" onClick={onClose} />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-md border-2 border-lime transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(35,26,36,0.62)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-ink/60" />
      )}

      <div
        key={i}
        className="animate-pop absolute rounded-lg border-2 border-ink bg-cream p-4 shadow-pop"
        style={cardStyle}
      >
        <div className="mb-1 flex items-center justify-between">
          <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/70">
            {i + 1} / {steps.length}
          </p>
          <button onClick={onClose} className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink underline underline-offset-4 hover:bg-lime">
            Skip
          </button>
        </div>
        <h2 className="font-display text-2xl font-extrabold text-ink">{step.title}</h2>
        <p className="mt-1 text-sm text-ink/80">{step.body}</p>
        <div className="mt-4 flex gap-2">
          {i > 0 && (
            <button className="btn-ghost px-3 py-2" onClick={() => setI(i - 1)}>
              Back
            </button>
          )}
          <button
            ref={nextRef}
            className="btn-primary ml-auto px-5 py-2"
            onClick={() => (last ? onClose() : setI(i + 1))}
          >
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
