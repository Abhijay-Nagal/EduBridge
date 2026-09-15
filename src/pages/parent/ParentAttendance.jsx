import { useAuth } from '../../context/AuthContext'
import AttendanceView from '../../components/AttendanceView'
import ChildPicker, { useSelectedChild } from '../../components/ChildPicker'
import { CalendarIcon } from '../../components/Icons'
import { EmptyState, PageHeader } from '../../components/ui'

export default function ParentAttendance() {
  const { user } = useAuth()
  const { children, child, selectedId, setSelectedId } = useSelectedChild(user.id)

  if (!child) {
    return <EmptyState icon={CalendarIcon} title="No children linked" hint="Ask the institute to link your child's account." />
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle={`${child.name} · ${child.batchName}`} />
      <ChildPicker children={children} selectedId={selectedId} onSelect={setSelectedId} />
      <AttendanceView studentId={child.id} />
    </div>
  )
}
