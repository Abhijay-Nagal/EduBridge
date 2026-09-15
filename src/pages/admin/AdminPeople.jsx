import { useState } from 'react'
import {
  addBatch,
  addParent,
  addStudent,
  attendanceSummary,
  getBatches,
  listParents,
  listStudents,
  removeBatch,
  removeStudent,
} from '../../data/db'
import { PlusIcon, TrashIcon, UsersIcon } from '../../components/Icons'
import {
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  SegmentedControl,
  Toast,
  useToast,
} from '../../components/ui'

export default function AdminPeople() {
  const toast = useToast()
  const [tab, setTab] = useState('students')
  const [modal, setModal] = useState(null)

  const students = listStudents()
  const parents = listParents()
  const batches = getBatches()

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Students, parents and batches"
        action={
          <button className="btn-primary shrink-0" onClick={() => setModal(tab)}>
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        }
      />

      <div className="mb-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'students', label: `Students (${students.length})` },
            { value: 'parents', label: `Parents (${parents.length})` },
            { value: 'batches', label: `Batches (${batches.length})` },
          ]}
        />
      </div>

      {tab === 'students' && <StudentList students={students} toast={toast} />}
      {tab === 'parents' && <ParentList parents={parents} />}
      {tab === 'batches' && <BatchList batches={batches} toast={toast} />}

      <AddStudentModal
        open={modal === 'students'}
        batches={batches}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          toast.show('Student added')
        }}
      />
      <AddParentModal
        open={modal === 'parents'}
        students={students}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          toast.show('Parent added')
        }}
      />
      <AddBatchModal
        open={modal === 'batches'}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          toast.show('Batch created')
        }}
      />

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}

function StudentList({ students, toast }) {
  const [confirming, setConfirming] = useState(null)

  if (students.length === 0) {
    return <EmptyState icon={UsersIcon} title="No students yet" hint="Add your first student to get started." />
  }

  return (
    <>
      <div className="space-y-2">
        {students.map((s) => {
          const summary = attendanceSummary(s.id)
          return (
            <div key={s.id} className="card animate-fade-up flex items-center gap-3">
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
                <p className="mt-0.5 font-mono text-[11px] text-slate-400">{s.loginId}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge tone={summary.percent >= 75 ? 'green' : 'red'}>{summary.percent}%</Badge>
                <button
                  className="rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                  onClick={() => setConfirming(s)}
                  aria-label={`Remove ${s.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        title="Remove student?"
        footer={
          <>
            <button className="btn-ghost flex-1" onClick={() => setConfirming(null)}>
              Cancel
            </button>
            <button
              className="btn-danger flex-1"
              onClick={async () => {
                await removeStudent(confirming.id)
                setConfirming(null)
                toast.show('Student removed')
              }}
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          This permanently deletes <strong>{confirming?.name}</strong> along with their attendance, marks,
          quiz attempts and fee records. This cannot be undone.
        </p>
      </Modal>
    </>
  )
}

function ParentList({ parents }) {
  if (parents.length === 0) {
    return <EmptyState icon={UsersIcon} title="No parents yet" hint="Link a parent to a student to get started." />
  }

  return (
    <div className="space-y-2">
      {parents.map((p) => (
        <div key={p.id} className="card animate-fade-up">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
              {p.name
                .split(' ')
                .map((x) => x[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{p.name}</p>
              <p className="font-mono text-[11px] text-slate-400">{p.loginId}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {p.children.length === 0 ? (
              <span className="text-xs text-slate-400">No children linked</span>
            ) : (
              p.children.map((c) => (
                <Badge key={c.id} tone="brand">
                  {c.name}
                </Badge>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function BatchList({ batches, toast }) {
  return (
    <div className="space-y-2">
      {batches.map((b) => {
        const count = listStudents({ batchId: b.id }).length
        return (
          <div key={b.id} className="card animate-fade-up flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
              <UsersIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{b.name}</p>
              <p className="truncate text-xs text-slate-500">
                {b.subject} · {b.timing}
              </p>
            </div>
            <Badge tone="slate">{count} students</Badge>
            <button
              className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
              onClick={async () => {
                try {
                  await removeBatch(b.id)
                  toast.show('Batch deleted')
                } catch (err) {
                  toast.show(err.message)
                }
              }}
              aria-label={`Delete ${b.name}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

function AddStudentModal({ open, batches, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', loginId: '', password: 'student123', rollNo: '', batchId: '' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addStudent({
      name: form.name.trim(),
      loginId: form.loginId.trim(),
      password: form.password,
      rollNo: form.rollNo.trim(),
      batchId: form.batchId || batches[0]?.id,
    })
    setForm({ name: '', loginId: '', password: 'student123', rollNo: '', batchId: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add student">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={update('name')} placeholder="Aarav Gupta" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone (login)</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.loginId}
              onChange={update('loginId')}
              placeholder="9000000099"
              required
            />
          </div>
          <div>
            <label className="label">Roll no.</label>
            <input className="input" value={form.rollNo} onChange={update('rollNo')} placeholder="10A-07" required />
          </div>
        </div>
        <div>
          <label className="label">Batch</label>
          <select className="input" value={form.batchId} onChange={update('batchId')} required>
            <option value="">Select a batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" value={form.password} onChange={update('password')} required />
          <p className="mt-1 text-xs text-slate-400">Share this with the student. They can log in immediately.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Add student
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddParentModal({ open, students, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', loginId: '', password: 'parent123' })
  const [selected, setSelected] = useState([])
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = async (e) => {
    e.preventDefault()
    await addParent({
      name: form.name.trim(),
      loginId: form.loginId.trim(),
      password: form.password,
      studentIds: selected,
    })
    setForm({ name: '', loginId: '', password: 'parent123' })
    setSelected([])
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add parent">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={update('name')} placeholder="Sunita Gupta" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone (login)</label>
            <input
              className="input"
              inputMode="numeric"
              value={form.loginId}
              onChange={update('loginId')}
              placeholder="9000000098"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" value={form.password} onChange={update('password')} required />
          </div>
        </div>
        <div>
          <label className="label">Link children ({selected.length} selected)</label>
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-2 ring-1 ring-inset ring-slate-200">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  selected.includes(s.id)
                    ? 'bg-brand-600 font-semibold text-white'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200'
                }`}
              >
                <span className="min-w-0 truncate">{s.name}</span>
                <span className="ml-2 shrink-0 text-xs opacity-70">{s.rollNo}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={selected.length === 0}>
            Add parent
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AddBatchModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', subject: '', timing: '' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addBatch({
      name: form.name.trim(),
      subject: form.subject.trim(),
      timing: form.timing.trim(),
    })
    setForm({ name: '', subject: '', timing: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create batch">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Batch name</label>
          <input
            className="input"
            value={form.name}
            onChange={update('name')}
            placeholder="Class 11 — Batch A"
            required
          />
        </div>
        <div>
          <label className="label">Subject</label>
          <input
            className="input"
            value={form.subject}
            onChange={update('subject')}
            placeholder="Science & Maths"
            required
          />
        </div>
        <div>
          <label className="label">Timing</label>
          <input
            className="input"
            value={form.timing}
            onChange={update('timing')}
            placeholder="Mon–Sat, 5:00 PM"
            required
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Create
          </button>
        </div>
      </form>
    </Modal>
  )
}
