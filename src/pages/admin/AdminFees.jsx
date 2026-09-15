import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  addFee,
  addNotification,
  feeStats,
  listFees,
  listStudents,
  recordPayment,
} from '../../data/db'
import { BellIcon, CheckIcon, ClockIcon, PlusIcon, RupeeIcon } from '../../components/Icons'
import {
  Badge,
  EmptyState,
  Modal,
  PageHeader,
  SegmentedControl,
  StatCard,
  Toast,
  formatDate,
  formatRupees,
  useToast,
} from '../../components/ui'

const statusMeta = {
  paid: { tone: 'green', label: 'Paid' },
  due: { tone: 'amber', label: 'Due' },
  overdue: { tone: 'red', label: 'Overdue' },
}

export default function AdminFees() {
  const { user } = useAuth()
  const toast = useToast()
  const [filter, setFilter] = useState('unpaid')
  const [addOpen, setAddOpen] = useState(false)
  const [collecting, setCollecting] = useState(null)

  const stats = feeStats()
  const all = listFees()
  const students = listStudents()

  const visible =
    filter === 'all'
      ? all
      : filter === 'unpaid'
        ? all.filter((f) => f.status !== 'paid')
        : all.filter((f) => f.status === filter)

  const overdue = all.filter((f) => f.status === 'overdue')

  // Posts one notice to all parents — the manual stand-in for the scheduled
  // reminder job described in the project plan.
  const sendReminders = async () => {
    if (overdue.length === 0) {
      toast.show('No overdue fees to remind about')
      return
    }
    await addNotification({
      title: 'Fee payment reminder',
      body: `This is a reminder that the current fee instalment is overdue. Kindly clear the pending amount at the earliest via UPI or at the front desk. Please ignore this message if you have already paid.`,
      type: 'fee',
      audience: 'parents',
      batchId: null,
      createdBy: user.id,
    })
    toast.show(`Reminder sent to parents (${overdue.length} overdue)`)
  }

  return (
    <div>
      <PageHeader
        title="Fees"
        subtitle="Track dues and record payments"
        action={
          <button className="btn-primary shrink-0" onClick={() => setAddOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Add
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <StatCard label="Collected" value={formatRupees(stats.collected)} tone="green" icon={CheckIcon} />
        <StatCard
          label="Pending"
          value={formatRupees(stats.pending)}
          sub={`${stats.overdue} overdue`}
          tone={stats.overdue > 0 ? 'red' : 'amber'}
          icon={ClockIcon}
        />
      </div>

      <button onClick={sendReminders} className="btn-ghost mb-4 w-full py-3">
        <BellIcon className="h-4 w-4" />
        Send fee reminder to all parents
      </button>

      <div className="mb-4">
        <SegmentedControl
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'unpaid', label: `Unpaid (${all.filter((f) => f.status !== 'paid').length})` },
            { value: 'overdue', label: `Overdue (${overdue.length})` },
            { value: 'paid', label: 'Paid' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={RupeeIcon} title="Nothing here" hint="No fee records match this filter." />
      ) : (
        <div className="space-y-2">
          {visible.map((fee) => {
            const meta = statusMeta[fee.status]
            return (
              <div key={fee.id} className="card animate-fade-up">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      fee.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : fee.status === 'overdue'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <RupeeIcon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {fee.student?.name ?? 'Unknown student'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{fee.cycle}</p>
                    <p className="text-xs text-slate-400">Due {formatDate(fee.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">{formatRupees(fee.amount)}</p>
                    <Badge tone={meta.tone} className="mt-1">
                      {meta.label}
                    </Badge>
                  </div>
                </div>

                {fee.status !== 'paid' && (
                  <button
                    className="btn-primary mt-3 w-full py-2 text-xs"
                    onClick={() => setCollecting(fee)}
                  >
                    <CheckIcon className="h-4 w-4" />
                    Mark as paid
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AddFeeModal
        open={addOpen}
        students={students}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false)
          toast.show('Fee entry added')
        }}
      />

      <CollectModal
        fee={collecting}
        onClose={() => setCollecting(null)}
        onSaved={() => {
          setCollecting(null)
          toast.show('Payment recorded')
        }}
      />

      <Toast message={toast.message} onDone={toast.clear} />
    </div>
  )
}

function AddFeeModal({ open, students, onClose, onSaved }) {
  const [form, setForm] = useState({ studentId: '', amount: '2500', cycle: '', dueDate: '' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await addFee({
      studentId: form.studentId,
      amount: Number(form.amount),
      cycle: form.cycle.trim(),
      dueDate: form.dueDate,
    })
    setForm({ studentId: '', amount: '2500', cycle: '', dueDate: '' })
    onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add fee entry">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Student</label>
          <select className="input" value={form.studentId} onChange={update('studentId')} required>
            <option value="">Select a student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.rollNo}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Amount (₹)</label>
            <input type="number" className="input" value={form.amount} onChange={update('amount')} min="0" required />
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input" value={form.dueDate} onChange={update('dueDate')} required />
          </div>
        </div>
        <div>
          <label className="label">Cycle / description</label>
          <input
            className="input"
            value={form.cycle}
            onChange={update('cycle')}
            placeholder="Monthly — October"
            required
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Add entry
          </button>
        </div>
      </form>
    </Modal>
  )
}

function CollectModal({ fee, onClose, onSaved }) {
  const [mode, setMode] = useState('UPI')

  return (
    <Modal
      open={Boolean(fee)}
      onClose={onClose}
      title="Record payment"
      footer={
        <>
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary flex-1"
            onClick={async () => {
              await recordPayment(fee.id, mode)
              onSaved()
            }}
          >
            Confirm
          </button>
        </>
      }
    >
      <p className="mb-4 text-sm leading-relaxed text-slate-600">
        Recording <strong>{fee ? formatRupees(fee.amount) : ''}</strong> from{' '}
        <strong>{fee?.student?.name ?? ''}</strong> for {fee?.cycle}.
      </p>
      <div>
        <label className="label">Payment mode</label>
        <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="UPI">UPI</option>
          <option value="Cash">Cash</option>
          <option value="Bank transfer">Bank transfer</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>
    </Modal>
  )
}
