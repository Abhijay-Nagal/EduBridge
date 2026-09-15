import { useAuth } from '../../context/AuthContext'
import ProgressReport from '../../components/ProgressReport'
import ChildPicker, { useSelectedChild } from '../../components/ChildPicker'
import { ChartIcon } from '../../components/Icons'
import { EmptyState, PageHeader } from '../../components/ui'

export default function ParentProgress() {
  const { user } = useAuth()
  const { children, child, selectedId, setSelectedId } = useSelectedChild(user.id)

  if (!child) {
    return <EmptyState icon={ChartIcon} title="No children linked" hint="Ask the institute to link your child's account." />
  }

  return (
    <div>
      <PageHeader title="Progress report" subtitle={`${child.name} · ${child.batchName}`} />
      <ChildPicker children={children} selectedId={selectedId} onSelect={setSelectedId} />
      <ProgressReport studentId={child.id} />
    </div>
  )
}
