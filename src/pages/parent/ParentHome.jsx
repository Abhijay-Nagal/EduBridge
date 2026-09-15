import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  attendanceFor,
  attendanceSummary,
  feesFor,
  listNotifications,
  marksFor,
} from '../../data/db'
import ChildPicker, { useSelectedChild } from '../../components/ChildPicker'
import { BellIcon, ChartIcon, ChevronRightIcon, RupeeIcon } from '../../components/Icons'
import { EmptyState, formatDate, formatRelative, formatRupees } from '../../components/ui'
import Mascot, { MascotBuddy } from '../../components/Mascot'
import { AttendanceCard, ScoreCard } from '../../components/DashboardCards'

export default function ParentHome() {
  const { user } = useAuth()
  const { children, child, selectedId, setSelectedId } = useSelectedChild(user.id)

  if (!child) {
    return <EmptyState icon={ChartIcon} title="No children linked" hint="Ask the institute to link your child's account." />
  }

  const attendance = attendanceSummary(child.id)
  const recentAttendance = attendanceFor(child.id)
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
      <section className="sheen animate-slide-up relative rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-5 text-white shadow-lg shadow-brand-900/20">
        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/70">Welcome, {firstName}</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{child.name}</h1>
            <p className="mt-1 truncate text-sm text-white/75">
              {child.batchName} · Roll {child.rollNo}
            </p>
          </div>
          <Mascot size={100} lookAt interactive greet className="-mb-4 -mr-1 shrink-0" />
        </div>
      </section>

      <MascotBuddy
        size={78}
        className="animate-page-in"
        lines={[
          `${child.name.split(' ')[0]} is at ${attendance.percent}% attendance${
            attendance.percent >= 75 ? '. Comfortably above the requirement.' : ', below the 75% requirement.'
          }`,
          outstanding.length > 0
            ? `${formatRupees(outstanding.reduce((s, f) => s + f.amount, 0))} in fees is still pending.`
            : 'All fees are clear. Nothing pending.',
          termPercent !== null
            ? `Latest test came in at ${termPercent}%.`
            : 'No test marks recorded yet.',
          'Tap Progress for the full report card.',
        ]}
      />

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

      <div className="stagger space-y-3">
        <AttendanceCard summary={attendance} recent={recentAttendance} />
        <ScoreCard marks={marks} to="/parent/progress" />
      </div>

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
