import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { attendanceOn, getBatches, listStudents, markAttendance } from '../../data/db'
import { CalendarIcon, CheckIcon, ClockIcon, XIcon } from '../../components/Icons'
import { Badge, EmptyState, PageHeader, Toast, formatDate, useToast } from '../../components/ui'

const statuses = [
  { value: 'present', label: 'P', title: 'Present', icon: CheckIcon, active: 'bg-emerald-500 text-white', idle: 'text-emerald-600 bg-emerald-50' },
  { value: 'late', label: 'L', title: 'Late', icon: ClockIcon, active: 'bg-amber-500 text-white', idle: 'text-amber-600 bg-amber-50' },
  { value: 'absent', label: 'A', title: 'Absent', icon: XIcon, active: 'bg-rose-500 text-white', idle: 'text-rose-600 bg-rose-50' },
]

export default function AdminAttendance() {
  const { user, revision } = useAuth()
  const toast = useToast()
  const batches = getBatches()

  const today = new Date().toISOString().slice(0, 10)
  const [batchId, setBatchId] = useState(batches[0]?.id ?? '')
  const [date, setDate] = useState(today)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  // `revision` is in the deps so these recompute after a save.
  const students = useMemo(() => (batchId ? listStudents({ batchId }) : []), [batchId, revision])
  const existing = useMemo(
    () => (batchId ? attendanceOn(batchId, date) : []),
    [batchId, date, revision],
  )

  // Load whatever is already saved for this batch/date, defaulting to present.
  useEffect(() => {
    const next = {}
    for (const s of students) {
      const row = existing.find((a) => a.studentId === s.id)
      next[s.id] = row?.status ?? 'present'
    }
    setDraft(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId, date, students.length, existing.length])

  const counts = statuses.reduce((acc, s) => {
    acc[s.value] = Object.values(draft).filter((v) => v === s.value).length
    return acc
  }, {})

  const setAll = (status) => {
    const next = {}
    for (const s of students) next[s.id] = status
    setDraft(next)
  }

  const save = async () => {
    setSaving(true)
    await markAttendance(batchId, date, draft, user.id)
    setSaving(false)
    toast.show(`Attendance saved for ${formatDate(date)}`)
  }

  if (batches.length === 0) {
    return (
      <div>
        <PageHeader title="Attendance" />
        <EmptyState icon={CalendarIcon} title="No batches yet" hint="Create a batch under People first." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Mark attendance" subtitle="Tap a student to change their status" />

      <div className="card mb-4 animate-fade-up space-y-3">
        <div>
          <label className="label">Batch</label>
          <select className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {existing.length > 0 && (
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">
            Attendance already recorded for this date. Saving will overwrite it.
          </p>
        )}
      </div>

      {students.length === 0 ? (
        <EmptyState icon={CalendarIcon} title="No students in this batch" hint="Add students under People." />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="green">{counts.present} present</Badge>
            <Badge tone="amber">{counts.late} late</Badge>
            <Badge tone="red">{counts.absent} absent</Badge>
            <button className="btn-ghost ml-auto px-3 py-1.5 text-xs" onClick={() => setAll('present')}>
              All present
            </button>
          </div>

          <div className="card divide-y divide-slate-100 p-0">
            {students.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                  {s.rollNo.split('-')[1] ?? s.rollNo}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {statuses.map((status) => {
                    const selected = draft[s.id] === status.value
                    return (
                      <button
                        key={status.value}
                        onClick={() => setDraft((d) => ({ ...d, [s.id]: status.value }))}
                        title={status.title}
                        aria-label={`${s.name}: ${status.title}`}
                        className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-bold transition active:scale-95 ${
                          selected ? status.active : `${status.idle} opacity-40 hover:opacity-100`
                        }`}
                      >
                        {status.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={save} className="btn-primary mt-4 w-full py-3.5" disabled={saving}>
            {saving ? 'Saving…' : `Save attendance for ${formatDate(date)}`}
          </button>
        </>
      )}

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}
