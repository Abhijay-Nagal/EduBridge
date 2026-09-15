import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { marksFor } from '../data/db'
import { ChartIcon } from './Icons'
import { Badge, EmptyState, ProgressBar, formatDate } from './ui'

// Shared by the student's own progress page and the parent's child view.
export default function ProgressReport({ studentId }) {
  const marks = marksFor(studentId)

  const terms = useMemo(() => {
    const map = new Map()
    for (const m of marks) {
      if (!map.has(m.term)) map.set(m.term, [])
      map.get(m.term).push(m)
    }
    return Array.from(map.entries())
  }, [marks])

  const trend = useMemo(
    () =>
      terms.map(([term, rows]) => ({
        term: term.replace('Unit Test', 'UT'),
        percent: Math.round(
          (rows.reduce((s, r) => s + r.marks, 0) / rows.reduce((s, r) => s + r.maxMarks, 0)) * 100,
        ),
      })),
    [terms],
  )

  const subjectBreakdown = useMemo(() => {
    if (!terms.length) return []
    const [, latest] = terms[terms.length - 1]
    return latest.map((m) => ({
      subject: m.subject.slice(0, 4),
      percent: Math.round((m.marks / m.maxMarks) * 100),
    }))
  }, [terms])

  if (marks.length === 0) {
    return (
      <EmptyState
        icon={ChartIcon}
        title="No marks recorded yet"
        hint="Report cards will appear here once the teacher enters marks."
      />
    )
  }

  return (
    <div className="space-y-5">
      {trend.length > 1 && (
        <section className="card animate-fade-up">
          <h2 className="mb-3 font-bold text-slate-900">Performance trend</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(15,23,42,0.12)', fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {subjectBreakdown.length > 0 && (
        <section className="card animate-fade-up">
          <h2 className="mb-3 font-bold text-slate-900">Latest test by subject</h2>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectBreakdown} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(15,23,42,0.12)', fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Score']}
                />
                <Bar dataKey="percent" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {terms
        .slice()
        .reverse()
        .map(([term, rows]) => {
          const scored = rows.reduce((s, r) => s + r.marks, 0)
          const outOf = rows.reduce((s, r) => s + r.maxMarks, 0)
          const percent = Math.round((scored / outOf) * 100)
          return (
            <section key={term} className="card animate-fade-up">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h2 className="font-bold text-slate-900">{term}</h2>
                <p className="shrink-0 text-sm font-bold text-slate-900">
                  {scored}
                  <span className="font-medium text-slate-400">/{outOf}</span>
                  <span className="ml-1.5 text-xs font-semibold text-brand-600">{percent}%</span>
                </p>
              </div>

              <div className="space-y-3">
                {rows.map((m) => {
                  const p = Math.round((m.marks / m.maxMarks) * 100)
                  return (
                    <div key={m.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-700">{m.subject}</span>
                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                          {m.marks}/{m.maxMarks} · {p}%
                        </span>
                      </div>
                      <ProgressBar value={p} tone={p >= 75 ? 'green' : p >= 40 ? 'amber' : 'red'} />
                      {m.remark && (
                        <p className="mt-1.5 text-xs italic leading-relaxed text-slate-500">“{m.remark}”</p>
                      )}
                    </div>
                  )
                })}
              </div>

              <p className="mt-3 text-xs text-slate-400">Recorded {formatDate(rows[0].enteredAt)}</p>
            </section>
          )
        })}

      <div className="flex flex-wrap gap-2">
        <Badge tone="green">75% and above — strong</Badge>
        <Badge tone="amber">40–74% — needs work</Badge>
        <Badge tone="red">Below 40% — at risk</Badge>
      </div>
    </div>
  )
}
