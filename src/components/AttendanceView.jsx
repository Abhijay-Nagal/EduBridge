import { attendanceFor, attendanceSummary } from '../data/db'
import { CalendarIcon } from './Icons'
import { Badge, EmptyState, ProgressBar, StatCard, formatDate } from './ui'

const statusMeta = {
  present: { tone: 'green', label: 'Present' },
  late: { tone: 'amber', label: 'Late' },
  absent: { tone: 'red', label: 'Absent' },
}

// Shared by the student's own attendance view and the parent's child view.
export default function AttendanceView({ studentId }) {
  const rows = attendanceFor(studentId)
  const summary = attendanceSummary(studentId)

  if (rows.length === 0) {
    return <EmptyState icon={CalendarIcon} title="No attendance recorded" hint="Records appear once classes are marked." />
  }

  return (
    <div className="space-y-5">
      <section className="card animate-fade-up">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-bold text-slate-900">Overall attendance</h2>
          <span
            className={`text-2xl font-extrabold ${summary.percent >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {summary.percent}%
          </span>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          {summary.present + summary.late} of {summary.total} classes attended
        </p>
        <ProgressBar value={summary.percent} tone={summary.percent >= 75 ? 'green' : 'red'} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="green">{summary.present} present</Badge>
          <Badge tone="amber">{summary.late} late</Badge>
          <Badge tone="red">{summary.absent} absent</Badge>
        </div>
        {summary.percent < 75 && (
          <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            Below the 75% requirement. Please ensure regular attendance.
          </p>
        )}
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Present" value={summary.present} tone="green" />
        <StatCard label="Late" value={summary.late} tone="amber" />
        <StatCard label="Absent" value={summary.absent} tone="red" />
      </div>

      <section>
        <h2 className="section-title mb-2">Day-by-day record</h2>
        <div className="card divide-y divide-slate-100 p-0">
          {rows.slice(0, 40).map((row) => {
            const meta = statusMeta[row.status]
            return (
              <div key={row.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{formatDate(row.date)}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(row.date).toLocaleDateString('en-IN', { weekday: 'long' })}
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
