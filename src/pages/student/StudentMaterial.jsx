import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudentRecord, listMaterials } from '../../data/db'
import { BookIcon, LinkIcon } from '../../components/Icons'
import { Badge, EmptyState, PageHeader, SegmentedControl, formatDate } from '../../components/ui'

export default function StudentMaterial() {
  const { user } = useAuth()
  const student = getStudentRecord(user.id)
  const materials = listMaterials({ batchId: student.batchId })

  const subjects = useMemo(
    () => ['all', ...Array.from(new Set(materials.map((m) => m.subject)))],
    [materials],
  )
  const [subject, setSubject] = useState('all')
  const [openId, setOpenId] = useState(null)

  const visible = subject === 'all' ? materials : materials.filter((m) => m.subject === subject)

  return (
    <div>
      <PageHeader title="Study material" subtitle="Notes and resources for your batch" />

      {subjects.length > 2 && (
        <div className="mb-4">
          <SegmentedControl
            value={subject}
            onChange={setSubject}
            options={subjects.map((s) => ({ value: s, label: s === 'all' ? 'All subjects' : s }))}
          />
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={BookIcon}
          title="No material yet"
          hint="Your teacher hasn't uploaded anything for this subject."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((m) => {
            const expanded = openId === m.id
            return (
              <article key={m.id} className="card animate-fade-up">
                <button
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => setOpenId(expanded ? null : m.id)}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    {m.kind === 'link' ? <LinkIcon /> : <BookIcon />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{m.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge tone="brand">{m.subject}</Badge>
                      <Badge tone="slate">{m.topic}</Badge>
                    </span>
                  </span>
                </button>

                {expanded && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    {m.kind === 'link' ? (
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Open resource
                      </a>
                    ) : (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{m.body}</p>
                    )}
                    <p className="mt-3 text-xs text-slate-400">Uploaded {formatDate(m.uploadedAt)}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
