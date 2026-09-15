import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addNotification,
  deleteNotification,
  getBatches,
  isRead,
  listNotifications,
  markAllRead,
} from '../data/db'
import { BellIcon, PlusIcon, TrashIcon } from '../components/Icons'
import { Badge, EmptyState, Modal, PageHeader, Toast, formatRelative, useToast } from '../components/ui'

const typeMeta = {
  alert: { tone: 'red', label: 'Alert' },
  exam: { tone: 'amber', label: 'Exam' },
  fee: { tone: 'blue', label: 'Fee' },
  info: { tone: 'slate', label: 'Info' },
}

const audienceLabel = {
  all: 'Everyone',
  students: 'Students only',
  parents: 'Parents only',
}

export default function Notifications() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const [composeOpen, setComposeOpen] = useState(false)

  const notifications = listNotifications(user)
  const isAdmin = user.role === 'admin'

  // Reading the list marks it seen, which clears the tab badge.
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      await markAllRead(user)
      if (!cancelled) refresh()
    }, 700)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={isAdmin ? 'Everything you have posted' : 'Updates from your institute'}
        action={
          isAdmin && (
            <button className="btn-primary shrink-0" onClick={() => setComposeOpen(true)}>
              <PlusIcon className="h-4 w-4" />
              Post
            </button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState icon={BellIcon} title="Nothing yet" hint="New announcements will appear here." />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const meta = typeMeta[n.type] ?? typeMeta.info
            const unread = !isAdmin && !isRead(user.id, n.id)
            return (
              <article
                key={n.id}
                className={`card animate-fade-up ${unread ? 'ring-2 ring-brand-500/30' : ''}`}
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {isAdmin && <Badge tone="slate">{audienceLabel[n.audience]}</Badge>}
                  {unread && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                  <span className="ml-auto text-xs text-slate-400">{formatRelative(n.createdAt)}</span>
                </div>
                <h3 className="font-bold text-slate-900">{n.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">{n.body}</p>
                {isAdmin && (
                  <button
                    className="btn-danger mt-3 px-3 py-1.5 text-xs"
                    onClick={async () => {
                      await deleteNotification(n.id)
                      toast.show('Notification deleted')
                    }}
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <ComposeModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          onPosted={() => {
            setComposeOpen(false)
            toast.show('Notification sent')
          }}
          authorId={user.id}
        />
      )}

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}

function ComposeModal({ open, onClose, onPosted, authorId }) {
  const batches = getBatches()
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'info',
    audience: 'all',
    batchId: '',
  })

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addNotification({
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      audience: form.audience,
      batchId: form.batchId || null,
      createdBy: authorId,
    })
    setForm({ title: '', body: '', type: 'info', audience: 'all', batchId: '' })
    onPosted()
  }

  return (
    <Modal open={open} onClose={onClose} title="Post a notification">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="No class tomorrow"
            value={form.title}
            onChange={update('title')}
            required
          />
        </div>

        <div>
          <label className="label">Message</label>
          <textarea
            className="input min-h-[110px] resize-y"
            placeholder="Write the announcement…"
            value={form.body}
            onChange={update('body')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={update('type')}>
              <option value="info">Info</option>
              <option value="alert">Alert</option>
              <option value="exam">Exam</option>
              <option value="fee">Fee</option>
            </select>
          </div>
          <div>
            <label className="label">Send to</label>
            <select className="input" value={form.audience} onChange={update('audience')}>
              <option value="all">Everyone</option>
              <option value="students">Students only</option>
              <option value="parents">Parents only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Batch</label>
          <select className="input" value={form.batchId} onChange={update('batchId')}>
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Send
          </button>
        </div>
      </form>
    </Modal>
  )
}
