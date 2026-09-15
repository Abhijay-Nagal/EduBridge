import { useAuth } from '../../context/AuthContext'
import { feesFor } from '../../data/db'
import ChildPicker, { useSelectedChild } from '../../components/ChildPicker'
import { CheckIcon, ClockIcon, RupeeIcon } from '../../components/Icons'
import {
  Badge,
  EmptyState,
  PageHeader,
  StatCard,
  formatDate,
  formatRupees,
} from '../../components/ui'

const statusMeta = {
  paid: { tone: 'green', label: 'Paid', icon: CheckIcon },
  due: { tone: 'amber', label: 'Due', icon: ClockIcon },
  overdue: { tone: 'red', label: 'Overdue', icon: ClockIcon },
}

export default function ParentFees() {
  const { user } = useAuth()
  const { children, child, selectedId, setSelectedId } = useSelectedChild(user.id)

  if (!child) {
    return <EmptyState icon={RupeeIcon} title="No children linked" hint="Ask the institute to link your child's account." />
  }

  const fees = feesFor(child.id)
  const outstanding = fees.filter((f) => f.status !== 'paid')
  const totalDue = outstanding.reduce((s, f) => s + f.amount, 0)
  const totalPaid = fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0)

  return (
    <div>
      <PageHeader title="Fees" subtitle={`${child.name} · ${child.batchName}`} />
      <ChildPicker children={children} selectedId={selectedId} onSelect={setSelectedId} />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          label="Outstanding"
          value={formatRupees(totalDue)}
          sub={`${outstanding.length} unpaid`}
          tone={outstanding.some((f) => f.status === 'overdue') ? 'red' : 'amber'}
          icon={RupeeIcon}
        />
        <StatCard label="Paid to date" value={formatRupees(totalPaid)} tone="green" icon={CheckIcon} />
      </div>

      {totalDue > 0 && (
        <div className="card mb-5 animate-fade-up bg-brand-50 ring-brand-100">
          <p className="text-sm font-semibold text-brand-900">How to pay</p>
          <p className="mt-1 text-sm leading-relaxed text-brand-800/80">
            Pay by UPI or cash at the front desk. The institute will mark it as paid here once received.
          </p>
        </div>
      )}

      {fees.length === 0 ? (
        <EmptyState icon={RupeeIcon} title="No fee records" hint="Fee entries will appear here." />
      ) : (
        <section>
          <h2 className="section-title mb-2">Payment history</h2>
          <div className="space-y-2">
            {fees.map((fee) => {
              const meta = statusMeta[fee.status]
              const Icon = meta.icon
              return (
                <div key={fee.id} className="card animate-fade-up flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                      fee.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600'
                        : fee.status === 'overdue'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{fee.cycle}</p>
                    <p className="text-xs text-slate-500">Due {formatDate(fee.dueDate)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">{formatRupees(fee.amount)}</p>
                    <Badge tone={meta.tone} className="mt-1">
                      {meta.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
