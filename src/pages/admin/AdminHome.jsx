import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  attendanceSummary,
  feeStats,
  getBatches,
  getInstitute,
  listFees,
  listMaterials,
  listNotifications,
  listQuizzes,
  listStudents,
} from '../../data/db'
import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  PlusIcon,
  QuizIcon,
  RupeeIcon,
  UsersIcon,
} from '../../components/Icons'
import { Badge, StatCard, formatDate, formatRelative, formatRupees } from '../../components/ui'

const quickActions = [
  { to: '/admin/attendance', label: 'Mark attendance', icon: CalendarIcon, tone: 'bg-sky-50 text-sky-600' },
  { to: '/admin/notifications', label: 'Post notice', icon: BellIcon, tone: 'bg-rose-50 text-rose-600' },
  { to: '/admin/content', label: 'Upload material', icon: BookIcon, tone: 'bg-brand-50 text-brand-600' },
  { to: '/admin/marks', label: 'Enter marks', icon: ChartIcon, tone: 'bg-emerald-50 text-emerald-600' },
]

export default function AdminHome() {
  const { user } = useAuth()
  const institute = getInstitute()
  const students = listStudents()
  const batches = getBatches()
  const fees = feeStats()
  const notifications = listNotifications(user).slice(0, 3)
  const materials = listMaterials()
  const quizzes = listQuizzes()

  const today = new Date().toISOString().slice(0, 10)
  const overdueFees = listFees().filter((f) => f.status === 'overdue')

  // Students whose attendance has dropped below the 75% requirement.
  const lowAttendance = students
    .map((s) => ({ ...s, summary: attendanceSummary(s.id) }))
    .filter((s) => s.summary.total > 0 && s.summary.percent < 75)
    .sort((a, b) => a.summary.percent - b.summary.percent)

  const firstName = user.name.split(' ')[0]

  return (
    <div className="space-y-5">
      <section className="animate-fade-up rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-lg">
        <p className="text-sm text-white/70">{institute.name}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-white/75">
          {students.length} students · {batches.length} batches
        </p>
      </section>

      <section className="animate-fade-up">
        <h2 className="section-title mb-2">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(({ to, label, icon: Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="card flex items-center gap-3 transition hover:shadow-md active:scale-[0.98]"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 text-sm font-semibold leading-tight text-slate-800">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Fees collected"
          value={formatRupees(fees.collected)}
          sub="All time"
          tone="green"
          icon={RupeeIcon}
        />
        <StatCard
          label="Fees pending"
          value={formatRupees(fees.pending)}
          sub={`${fees.overdue} overdue`}
          tone={fees.overdue > 0 ? 'red' : 'amber'}
          icon={RupeeIcon}
        />
        <StatCard label="Study material" value={materials.length} sub="Items uploaded" tone="brand" icon={BookIcon} />
        <StatCard label="Quizzes" value={quizzes.length} sub="Published" tone="blue" icon={QuizIcon} />
      </div>

      {overdueFees.length > 0 && (
        <section className="animate-fade-up">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Overdue fees ({overdueFees.length})</h2>
            <Link to="/admin/fees" className="text-xs font-semibold text-brand-600">
              Manage
            </Link>
          </div>
          <div className="card divide-y divide-slate-100 p-0">
            {overdueFees.slice(0, 4).map((fee) => (
              <div key={fee.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {fee.student?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400">Due {formatDate(fee.dueDate)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-slate-900">{formatRupees(fee.amount)}</p>
                  <Badge tone="red" className="mt-0.5">
                    Overdue
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {lowAttendance.length > 0 && (
        <section className="animate-fade-up">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Low attendance ({lowAttendance.length})</h2>
            <Link to="/admin/attendance" className="text-xs font-semibold text-brand-600">
              Mark today
            </Link>
          </div>
          <div className="card divide-y divide-slate-100 p-0">
            {lowAttendance.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                  <p className="truncate text-xs text-slate-400">{s.batchName}</p>
                </div>
                <Badge tone="red">{s.summary.percent}%</Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="animate-fade-up">
        <h2 className="section-title mb-2">Batches</h2>
        <div className="space-y-2">
          {batches.map((batch) => {
            const count = listStudents({ batchId: batch.id }).length
            return (
              <Link
                key={batch.id}
                to="/admin/people"
                className="card flex items-center gap-3 transition hover:shadow-md active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <UsersIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{batch.name}</span>
                  <span className="block truncate text-xs text-slate-500">{batch.timing}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-slate-400">{count}</span>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Recent notices</h2>
          <Link to="/admin/notifications" className="text-xs font-semibold text-brand-600">
            <PlusIcon className="inline h-3.5 w-3.5" /> Post
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="card text-sm text-slate-500">You haven't posted anything yet.</p>
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
