import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStudentRecord } from '../../data/db'
import AttendanceView from '../../components/AttendanceView'
import ProgressReport from '../../components/ProgressReport'
import { PageHeader, SegmentedControl } from '../../components/ui'

export default function StudentProgress() {
  const { user } = useAuth()
  const student = getStudentRecord(user.id)
  const [tab, setTab] = useState('report')

  return (
    <div>
      <PageHeader title="My progress" subtitle="Report card and attendance record" />

      <div className="mb-4">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'report', label: 'Report card' },
            { value: 'attendance', label: 'Attendance' },
          ]}
        />
      </div>

      {tab === 'report' ? (
        <ProgressReport studentId={student.id} />
      ) : (
        <AttendanceView studentId={student.id} />
      )}
    </div>
  )
}
