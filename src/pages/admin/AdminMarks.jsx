import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { addMarks, deleteMarks, listStudents, marksFor } from '../../data/db'
import { ArrowLeftIcon, ChartIcon, PlusIcon, TrashIcon } from '../../components/Icons'
import {
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  ProgressBar,
  Toast,
  formatDate,
  useToast,
} from '../../components/ui'

export default function AdminMarks() {
  const navigate = useNavigate()
  const toast = useToast()
  const [modalStudent, setModalStudent] = useState(null)
  const students = listStudents()

  return (
    <div>
      <button onClick={() => navigate('/admin')} className="btn-ghost mb-4 px-3 py-2 text-xs">
        <ArrowLeftIcon className="h-4 w-4" />
        Dashboard
      </button>

      <PageHeader title="Marks & remarks" subtitle="Enter test results students and parents will see" />

      {students.length === 0 ? (
        <EmptyState icon={ChartIcon} title="No students yet" hint="Add students under People first." />
      ) : (
        <div className="space-y-3">
          {students.map((s) => {
            const marks = marksFor(s.id)
            const terms = Array.from(new Set(marks.map((m) => m.term)))
            const latestTerm = terms[terms.length - 1]
            const latest = marks.filter((m) => m.term === latestTerm)
            const percent = latest.length
              ? Math.round(
                  (latest.reduce((a, m) => a + m.marks, 0) / latest.reduce((a, m) => a + m.maxMarks, 0)) * 100,
                )
              : null

            return (
              <article key={s.id} className="card animate-fade-up">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">
                    {s.name
                      .split(' ')
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {s.rollNo} · {s.batchName}
                    </p>
                  </div>
                  <button className="btn-primary shrink-0 px-3 py-1.5 text-xs" onClick={() => setModalStudent(s)}>
                    <PlusIcon className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>

                {marks.length === 0 ? (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    No marks recorded yet.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                    {percent !== null && (
                      <div className="flex items-center gap-2">
                        <Badge tone="slate">{latestTerm}</Badge>
                        <Badge tone={percent >= 75 ? 'green' : percent >= 40 ? 'amber' : 'red'}>
                          {percent}%
                        </Badge>
                      </div>
                    )}
                    {marks
                      .slice()
                      .reverse()
                      .slice(0, 6)
                      .map((m) => {
                        const p = Math.round((m.marks / m.maxMarks) * 100)
                        return (
                          <div key={m.id}>
                            <div className="mb-1 flex items-baseline justify-between gap-2">
                              <span className="min-w-0 truncate text-sm font-semibold text-slate-700">
                                {m.subject}
                                <span className="ml-1.5 text-xs font-normal text-slate-400">{m.term}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">
                                  {m.marks}/{m.maxMarks}
                                </span>
                                <button
                                  className="rounded p-1 text-slate-300 transition hover:text-rose-600"
                                  onClick={async () => {
                                    await deleteMarks(m.id)
                                    toast.show('Entry deleted')
                                  }}
                                  aria-label="Delete entry"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            </div>
                            <ProgressBar value={p} tone={p >= 75 ? 'green' : p >= 40 ? 'amber' : 'red'} />
                            {m.remark && (
                              <p className="mt-1 text-xs italic text-slate-500">“{m.remark}”</p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <AddMarksModal
        student={modalStudent}
        onClose={() => setModalStudent(null)}
        onSaved={() => {
          setModalStudent(null)
          toast.show('Marks saved')
        }}
      />

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}

function AddMarksModal({ student, onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({ term: '', subject: '', marks: '', maxMarks: '40', remark: '' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addMarks({
      studentId: student.id,
      term: form.term.trim(),
      subject: form.subject.trim(),
      marks: Number(form.marks),
      maxMarks: Number(form.maxMarks),
      remark: form.remark.trim(),
      enteredBy: user.id,
    })
    setForm({ term: '', subject: '', marks: '', maxMarks: '40', remark: '' })
    onSaved()
  }

  return (
    <Modal open={Boolean(student)} onClose={onClose} title={`Add marks — ${student?.name ?? ''}`}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Term / test name</label>
          <input
            className="input"
            value={form.term}
            onChange={update('term')}
            placeholder="Unit Test 3"
            required
          />
        </div>
        <div>
          <label className="label">Subject</label>
          <input className="input" value={form.subject} onChange={update('subject')} placeholder="Physics" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Marks scored</label>
            <input
              type="number"
              className="input"
              value={form.marks}
              onChange={update('marks')}
              min="0"
              max={form.maxMarks || undefined}
              required
            />
          </div>
          <div>
            <label className="label">Out of</label>
            <input
              type="number"
              className="input"
              value={form.maxMarks}
              onChange={update('maxMarks')}
              min="1"
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Remark (visible to parents)</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.remark}
            onChange={update('remark')}
            placeholder="Good conceptual clarity. Needs more practice on numericals."
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Save marks
          </button>
        </div>
      </form>
    </Modal>
  )
}
