import { Link } from 'react-router-dom'
import {
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  ClockIcon,
  QuizIcon,
} from './Icons'
import { Badge, ProgressRing, formatDate } from './ui'
import { useCountUp } from '../hooks/useCountUp'
import CardBackdrop from './CardBackdrop'

const statusColor = {
  present: 'bg-emerald-400',
  late: 'bg-amber-400',
  absent: 'bg-rose-400',
}

// Attendance: a ring for the headline figure, plus a strip of the most recent
// sessions so the number has some texture behind it.
export function AttendanceCard({ summary, recent = [], days = 18 }) {
  const good = summary.percent >= 75
  const tone = good ? 'green' : 'red'

  // `recent` arrives newest-first; show it left to right as oldest to newest.
  const strip = recent.slice(0, days).reverse()

  return (
    <section className="card group">
      <CardBackdrop tone={good ? 'green' : 'red'} symbols="people" count={5} grid seed={1} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Attendance</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {summary.present + summary.late} of {summary.total} classes attended
          </p>
        </div>
        <span
          className={`tile grid h-9 w-9 place-items-center rounded-xl ${
            good ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-3 flex items-center gap-4">
        <ProgressRing value={summary.percent} size={86} stroke={9} tone={tone}>
          <div className="text-center">
            <p className="text-lg font-extrabold leading-none text-slate-900">
              {summary.percent}
              <span className="text-[10px] font-bold text-slate-400">%</span>
            </p>
          </div>
        </ProgressRing>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="green">{summary.present} present</Badge>
            <Badge tone="amber">{summary.late} late</Badge>
            <Badge tone="red">{summary.absent} absent</Badge>
          </div>

          {strip.length > 0 && (
            <>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Last {strip.length} sessions
              </p>
              <div className="mt-1.5 flex items-end gap-[3px]">
                {strip.map((row, i) => (
                  <span
                    key={row.id}
                    title={`${formatDate(row.date)} — ${row.status}`}
                    className={`cell-in flex-1 rounded-sm ${statusColor[row.status]} ${
                      row.status === 'present' ? 'h-5' : row.status === 'late' ? 'h-3.5' : 'h-2'
                    }`}
                    style={{ animationDelay: `${i * 28}ms` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {!good && (
        <p className="relative mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
          Below the 75% requirement. Try not to miss the next few classes.
        </p>
      )}
    </section>
  )
}

// Latest test: headline percentage, movement against the previous test, and a
// bar per subject that fills on mount.
export function ScoreCard({ marks = [], to }) {
  // Group into terms, preserving the order marks were recorded in.
  const terms = []
  for (const m of marks) {
    let bucket = terms.find((t) => t.term === m.term)
    if (!bucket) {
      bucket = { term: m.term, rows: [] }
      terms.push(bucket)
    }
    bucket.rows.push(m)
  }

  const pct = (rows) =>
    Math.round((rows.reduce((s, r) => s + r.marks, 0) / rows.reduce((s, r) => s + r.maxMarks, 0)) * 100)

  const latest = terms[terms.length - 1]
  const previous = terms[terms.length - 2]
  const percent = latest ? pct(latest.rows) : null
  const delta = latest && previous ? percent - pct(previous.rows) : null
  const shown = useCountUp(percent ?? 0, 1000)

  if (!latest) {
    return (
      <section className="card">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest test</p>
        <p className="mt-2 text-sm text-slate-500">No marks recorded yet.</p>
      </section>
    )
  }

  const tone = percent >= 75 ? 'emerald' : percent >= 40 ? 'amber' : 'rose'
  // Full class names only: Tailwind cannot generate classes from interpolation.
  const glowTone = {
    emerald: 'bg-emerald-300/30',
    amber: 'bg-amber-300/30',
    rose: 'bg-rose-300/30',
  }[tone]
  // Each subject is coloured by its own result, so a mixed report card looks
  // mixed rather than flat.
  const barFor = (p) =>
    p >= 75
      ? 'from-emerald-400 to-emerald-600'
      : p >= 40
        ? 'from-amber-400 to-amber-600'
        : 'from-rose-400 to-rose-600'

  const Wrapper = to ? Link : 'section'
  const wrapperProps = to ? { to } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className="card group block transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardBackdrop
        tone={tone === 'emerald' ? 'green' : tone === 'rose' ? 'red' : 'amber'}
        symbols="maths"
        count={4}
        seed={2}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
            {latest.term}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-3xl font-extrabold leading-none tracking-tight text-slate-900">
              {Math.round(shown)}
              <span className="text-base font-bold text-slate-400">%</span>
            </p>
            {delta !== null && delta !== 0 && (
              <span
                className={`chip ${
                  delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {latest.rows.length} subject{latest.rows.length > 1 ? 's' : ''}
            {previous ? ` · vs ${previous.term}` : ''}
          </p>
        </div>

        <span className="tile grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <ChartIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-4 space-y-2">
        {latest.rows.map((m, i) => {
          const p = Math.round((m.marks / m.maxMarks) * 100)
          return (
            <div key={m.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-semibold text-slate-600">{m.subject}</span>
                <span className="shrink-0 text-[11px] font-bold text-slate-400">
                  {m.marks}/{m.maxMarks}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`fill-in h-full rounded-full bg-gradient-to-r ${barFor(p)}`}
                  style={{ width: `${p}%`, animationDelay: `${120 + i * 110}ms` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Wrapper>
  )
}

// A pending quiz, with the deadline promoted to the front of the card.
export function QuizCard({ quiz, index = 0 }) {
  const msLeft = new Date(quiz.dueAt).getTime() - Date.now()
  const daysLeft = Math.ceil(msLeft / 86400000)
  const overdue = msLeft < 0
  const urgent = !overdue && daysLeft <= 1

  const due = overdue
    ? 'Past due'
    : daysLeft <= 0
      ? 'Due today'
      : daysLeft === 1
        ? 'Due tomorrow'
        : `${daysLeft} days left`

  return (
    <Link
      to={`/student/quizzes/${quiz.id}`}
      className="card card-accent group flex items-center gap-3 overflow-hidden pl-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardBackdrop
        tone={overdue ? 'red' : 'amber'}
        symbols="maths"
        count={4}
        seed={index + 3}
      />
      <span
        className={`tile grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
          overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
        } ${urgent ? 'pulse-soft' : ''}`}
      >
        <QuizIcon />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900">{quiz.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{quiz.subject}</Badge>
          <Badge tone="slate">{quiz.questions.length} questions</Badge>
          <Badge tone={overdue ? 'red' : urgent ? 'amber' : 'slate'}>
            <ClockIcon className="h-3 w-3" />
            {due}
          </Badge>
        </span>
      </span>

      <ChevronRightIcon className="nudge h-5 w-5 shrink-0 text-slate-300 group-hover:text-brand-500" />
    </Link>
  )
}
