import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  addMaterial,
  addQuiz,
  deleteMaterial,
  deleteQuiz,
  getBatches,
  listAttempts,
  listMaterials,
  listQuizzes,
} from '../../data/db'
import { BookIcon, LinkIcon, PlusIcon, QuizIcon, TrashIcon } from '../../components/Icons'
import {
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  SegmentedControl,
  Toast,
  formatDate,
  useToast,
} from '../../components/ui'

export default function AdminContent() {
  const toast = useToast()
  const [tab, setTab] = useState('material')
  const [modal, setModal] = useState(null)

  const batches = getBatches()
  const materials = listMaterials()
  const quizzes = listQuizzes()

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Study material and quizzes"
        action={
          <button className="btn-primary shrink-0" onClick={() => setModal(tab)}>
            <PlusIcon className="h-4 w-4" />
            New
          </button>
        }
      />

      <div className="mb-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'material', label: `Material (${materials.length})` },
            { value: 'quiz', label: `Quizzes (${quizzes.length})` },
          ]}
        />
      </div>

      {tab === 'material' ? (
        <MaterialList materials={materials} batches={batches} toast={toast} />
      ) : (
        <QuizList quizzes={quizzes} batches={batches} toast={toast} />
      )}

      <AddMaterialModal
        open={modal === 'material'}
        batches={batches}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          toast.show('Material uploaded')
        }}
      />
      <AddQuizModal
        open={modal === 'quiz'}
        batches={batches}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null)
          toast.show('Quiz published')
        }}
      />

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}

function MaterialList({ materials, batches, toast }) {
  if (materials.length === 0) {
    return <EmptyState icon={BookIcon} title="No material yet" hint="Upload notes or share a resource link." />
  }

  return (
    <div className="space-y-2">
      {materials.map((m) => {
        const batch = batches.find((b) => b.id === m.batchId)
        return (
          <div key={m.id} className="card animate-fade-up">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                {m.kind === 'link' ? <LinkIcon /> : <BookIcon />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{m.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{m.subject}</Badge>
                  <Badge tone="slate">{m.topic}</Badge>
                  <Badge tone="blue">{batch?.name ?? 'Unknown batch'}</Badge>
                </div>
              </div>
              <button
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                onClick={async () => {
                  await deleteMaterial(m.id)
                  toast.show('Material deleted')
                }}
                aria-label={`Delete ${m.title}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">Uploaded {formatDate(m.uploadedAt)}</p>
          </div>
        )
      })}
    </div>
  )
}

function QuizList({ quizzes, batches, toast }) {
  if (quizzes.length === 0) {
    return <EmptyState icon={QuizIcon} title="No quizzes yet" hint="Create a multiple-choice quiz for a batch." />
  }

  return (
    <div className="space-y-2">
      {quizzes.map((q) => {
        const batch = batches.find((b) => b.id === q.batchId)
        const attempts = listAttempts(q.id)
        const avg = attempts.length
          ? Math.round(
              (attempts.reduce((s, a) => s + a.score / a.maxScore, 0) / attempts.length) * 100,
            )
          : null
        return (
          <div key={q.id} className="card animate-fade-up">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <QuizIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{q.title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="brand">{q.subject}</Badge>
                  <Badge tone="blue">{batch?.name ?? 'Unknown batch'}</Badge>
                  <Badge tone="slate">{q.questions.length} questions</Badge>
                </div>
              </div>
              <button
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                onClick={async () => {
                  await deleteQuiz(q.id)
                  toast.show('Quiz deleted')
                }}
                aria-label={`Delete ${q.title}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <Badge tone={attempts.length ? 'green' : 'slate'}>{attempts.length} attempted</Badge>
              {avg !== null && <Badge tone={avg >= 60 ? 'green' : 'amber'}>Avg {avg}%</Badge>}
              <span className="ml-auto text-xs text-slate-400">Due {formatDate(q.dueAt)}</span>
            </div>

            {attempts.length > 0 && (
              <div className="mt-2 space-y-1">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="truncate text-slate-600">{a.student?.name ?? 'Unknown'}</span>
                    <span className="shrink-0 font-semibold text-slate-800">
                      {a.score}/{a.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AddMaterialModal({ open, batches, onClose, onSaved }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: '',
    subject: '',
    topic: '',
    kind: 'note',
    body: '',
    url: '',
    batchId: '',
  })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addMaterial({
      title: form.title.trim(),
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      kind: form.kind,
      body: form.kind === 'note' ? form.body.trim() : undefined,
      url: form.kind === 'link' ? form.url.trim() : undefined,
      batchId: form.batchId || batches[0]?.id,
      uploadedBy: user.id,
    })
    setForm({ title: '', subject: '', topic: '', kind: 'note', body: '', url: '', batchId: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Upload study material">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={form.title}
            onChange={update('title')}
            placeholder="Ray Diagrams — Class Notes"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Subject</label>
            <input className="input" value={form.subject} onChange={update('subject')} placeholder="Physics" required />
          </div>
          <div>
            <label className="label">Topic</label>
            <input className="input" value={form.topic} onChange={update('topic')} placeholder="Light" required />
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
          <label className="label">Type</label>
          <select className="input" value={form.kind} onChange={update('kind')}>
            <option value="note">Written notes</option>
            <option value="link">External link</option>
          </select>
        </div>
        {form.kind === 'note' ? (
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={form.body}
              onChange={update('body')}
              placeholder="Type the notes students should read…"
              required
            />
          </div>
        ) : (
          <div>
            <label className="label">Link</label>
            <input
              type="url"
              className="input"
              value={form.url}
              onChange={update('url')}
              placeholder="https://…"
              required
            />
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Upload
          </button>
        </div>
      </form>
    </Modal>
  )
}

const blankQuestion = () => ({ text: '', options: ['', '', '', ''], correctIndex: 0 })

function AddQuizModal({ open, batches, onClose, onSaved }) {
  const [meta, setMeta] = useState({ title: '', subject: '', batchId: '', dueAt: '' })
  const [questions, setQuestions] = useState([blankQuestion()])
  const [error, setError] = useState('')

  const updateMeta = (k) => (e) => setMeta((m) => ({ ...m, [k]: e.target.value }))

  const updateQuestion = (index, patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)))

  const updateOption = (qIndex, oIndex, value) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.map((o, j) => (j === oIndex ? value : o)) } : q,
      ),
    )

  const submit = async (e) => {
    e.preventDefault()
    const cleaned = questions.filter((q) => q.text.trim() && q.options.every((o) => o.trim()))
    if (cleaned.length === 0) {
      setError('Add at least one question with all four options filled in.')
      return
    }
    const due = meta.dueAt
      ? new Date(`${meta.dueAt}T21:00:00`).toISOString()
      : new Date(Date.now() + 7 * 86400000).toISOString()

    await addQuiz({
      title: meta.title.trim(),
      subject: meta.subject.trim(),
      batchId: meta.batchId || batches[0]?.id,
      dueAt: due,
      questions: cleaned.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
      })),
    })
    setMeta({ title: '', subject: '', batchId: '', dueAt: '' })
    setQuestions([blankQuestion()])
    setError('')
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create quiz">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Quiz title</label>
          <input
            className="input"
            value={meta.title}
            onChange={updateMeta('title')}
            placeholder="Light — Quick Test"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Subject</label>
            <input className="input" value={meta.subject} onChange={updateMeta('subject')} placeholder="Physics" required />
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={meta.dueAt} onChange={updateMeta('dueAt')} />
          </div>
        </div>
        <div>
          <label className="label">Batch</label>
          <select className="input" value={meta.batchId} onChange={updateMeta('batchId')} required>
            <option value="">Select a batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <p className="section-title">Questions ({questions.length})</p>
            <button
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => setQuestions((qs) => [...qs, blankQuestion()])}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          {questions.map((q, qIndex) => (
            <div key={qIndex} className="rounded-xl bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Q{qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-1 text-slate-400 hover:text-rose-600"
                    onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qIndex))}
                    aria-label={`Remove question ${qIndex + 1}`}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input
                className="input mb-2 bg-white"
                value={q.text}
                onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                placeholder="Question text"
              />
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Tap the circle to mark the correct answer
              </p>
              <div className="space-y-1.5">
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIndex, { correctIndex: oIndex })}
                      aria-label={`Mark option ${String.fromCharCode(65 + oIndex)} correct`}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition ${
                        q.correctIndex === oIndex
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-slate-400 ring-1 ring-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + oIndex)}
                    </button>
                    <input
                      className="input bg-white py-2"
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Publish quiz
          </button>
        </div>
      </form>
    </Modal>
  )
}
