import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { attendanceSummary, feesFor, listNotifications, marksFor } from '../../data/db'
import ChildPicker, { useSelectedChild } from '../../components/ChildPicker'
import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  RupeeIcon,
} from '../../components/Icons'
import {
  Badge,
  EmptyState,
  ProgressBar,
  StatCard,
  formatDate,
  formatRelative,
  formatRupees,
} from '../../components/ui'

export default function ParentHome() {
  const { user } = useAuth()
  const { children, child, selectedId, setSelectedId } = useSelectedChild(user.id)

  if (!child) {
    return <EmptyState icon={ChartIcon} title="No children linked" hint="Ask the institute to link your child's account." />
  }

  const attendance = attendanceSummary(child.id)
  const marks = marksFor(child.id)
  const fees = feesFor(child.id)
  const outstanding = fees.filter((f) => f.status !== 'paid')
  const notifications = listNotifications(user).slice(0, 3)

  const latestTerm = marks.length ? marks[marks.length - 1].term : null
  const termMarks = marks.filter((m) => m.term === latestTerm)
  const termPercent = termMarks.length
    ? Math.round(
        (termMarks.reduce((s, m) => s + m.marks, 0) / termMarks.reduce((s, m) => s + m.maxMarks, 0)) * 100,
      )
    : null

  const firstName = user.name.split(' ')[0]

  return (
    <div className="space-y-5">
      <section className="animate-fade-up rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lg">
        <p className="text-sm text-white/70">Welcome, {firstName}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{child.name}</h1>
        <p className="mt-1 text-sm text-white/75">
          {child.batchName} · Roll {child.rollNo}
        </p>
      </section>

      <ChildPicker children={children} selectedId={selectedId} onSelect={setSelectedId} />

      {outstanding.length > 0 && (
        <Link
          to="/parent/fees"
          className={`block animate-fade-up rounded-2xl p-4 shadow-sm ring-1 transition active:scale-[0.99] ${
            outstanding.some((f) => f.status === 'overdue')
              ? 'bg-rose-50 ring-rose-200'
              : 'bg-amber-50 ring-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                outstanding.some((f) => f.status === 'overdue')
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              <RupeeIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={`font-bold ${
                  outstanding.some((f) => f.status === 'overdue') ? 'text-rose-900' : 'text-amber-900'
                }`}
              >
                {outstanding.some((f) => f.status === 'overdue') ? 'Fee overdue' : 'Fee due soon'}
              </p>
              <p
                className={`text-sm ${
                  outstanding.some((f) => f.status === 'overdue') ? 'text-rose-700' : 'text-amber-700'
                }`}
              >
                {formatRupees(outstanding.reduce((s, f) => s + f.amount, 0))} · due{' '}
                {formatDate(outstanding[0].dueDate)}
              </p>
            </div>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Attendance"
          value={`${attendance.percent}%`}
          sub={`${attendance.absent} absences`}
          tone={attendance.percent >= 75 ? 'green' : 'red'}
          icon={CalendarIcon}
        />
        <StatCard
          label={latestTerm ?? 'Latest test'}
          value={termPercent === null ? '—' : `${termPercent}%`}
          sub={termMarks.length ? `${termMarks.length} subjects` : 'No marks yet'}
          tone="brand"
          icon={ChartIcon}
        />
      </div>

      <section className="card animate-fade-up">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Attendance</h2>
          <Link to="/parent/attendance" className="text-xs font-semibold text-brand-600">
            Details
          </Link>
        </div>
        <ProgressBar value={attendance.percent} tone={attendance.percent >= 75 ? 'green' : 'red'} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="green">{attendance.present} present</Badge>
          <Badge tone="amber">{attendance.late} late</Badge>
          <Badge tone="red">{attendance.absent} absent</Badge>
        </div>
      </section>

      {termMarks.length > 0 && (
        <section className="card animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">{latestTerm}</h2>
            <Link to="/parent/progress" className="text-xs font-semibold text-brand-600">
              Full report
            </Link>
          </div>
          <div className="space-y-3">
            {termMarks.map((m) => {
              const p = Math.round((m.marks / m.maxMarks) * 100)
              return (
                <div key={m.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-700">{m.subject}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {m.marks}/{m.maxMarks}
                    </span>
                  </div>
                  <ProgressBar value={p} tone={p >= 75 ? 'green' : p >= 40 ? 'amber' : 'red'} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">From the institute</h2>
          <Link to="/parent/notifications" className="text-xs font-semibold text-brand-600">
            See all
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="card text-sm text-slate-500">No announcements right now.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="card">
                <div className="mb-1 flex items-center gap-2">
                  <BellIcon className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate font-semibold text-slate-900">{n.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
