import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  attendanceFor,
  attendanceSummary,
  getAttempt,
  getBatch,
  getStudentRecord,
  listMaterials,
  listNotifications,
  listQuizzes,
  marksFor,
} from '../../data/db'
import { BellIcon, BookIcon } from '../../components/Icons'
import { formatRelative } from '../../components/ui'
import Mascot, { MascotBuddy } from '../../components/Mascot'
import { AttendanceCard, ScoreCard, QuizCard } from '../../components/DashboardCards'

export default function StudentHome() {
  const { user } = useAuth()
  const student = getStudentRecord(user.id)
  const batch = getBatch(student.batchId)

  const attendance = attendanceSummary(student.id)
  const recentAttendance = attendanceFor(student.id)
  const materials = listMaterials({ batchId: student.batchId })
  const quizzes = listQuizzes({ batchId: student.batchId })
  const pendingQuizzes = quizzes.filter((q) => !getAttempt(q.id, student.id))
  const notifications = listNotifications(user).slice(0, 3)

  // ScoreCard derives the term grouping and percentages itself.
  const marks = marksFor(student.id)

  const firstName = user.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-5">
      <section className="sheen animate-slide-up relative rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-5 text-white shadow-lg shadow-brand-900/20">
        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/70">{greeting},</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{firstName}</h1>
            <p className="mt-1 truncate text-sm text-white/75">
              {batch?.name} · Roll {student.rollNo}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/60">{batch?.timing}</p>
          </div>
          <Mascot
            size={104}
            lookAt
            interactive
            greet
            className="-mb-4 -mr-1 shrink-0"
          />
        </div>
      </section>

      <MascotBuddy
        size={78}
        className="animate-page-in"
        lines={[
          pendingQuizzes.length > 0
            ? `You have ${pendingQuizzes.length} quiz${pendingQuizzes.length > 1 ? 'zes' : ''} waiting. Want to knock one out?`
            : 'All quizzes done. Nicely kept up!',
          attendance.percent >= 75
            ? `Attendance is at ${attendance.percent}%. Keep it there.`
            : `Attendance is ${attendance.percent}%. Try not to miss the next few classes.`,
          materials.length > 0
            ? `${materials.length} items in Study Material, newest first.`
            : 'No study material yet. It will show up here.',
          'Tap me any time. I do not mind.',
        ]}
      />

      <div className="stagger space-y-3">
        <AttendanceCard summary={attendance} recent={recentAttendance} />
        <ScoreCard marks={marks} to="/student/progress" />
      </div>

      {pendingQuizzes.length > 0 && (
        <section>
          <h2 className="section-title mb-2">Pending quizzes</h2>
          <div className="space-y-2">
            {pendingQuizzes.map((quiz, i) => (
              <QuizCard key={quiz.id} quiz={quiz} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Latest material</h2>
          <Link to="/student/material" className="text-xs font-semibold text-brand-600">
            See all
          </Link>
        </div>
        {materials.length === 0 ? (
          <p className="card text-sm text-slate-500">No study material uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {materials.slice(0, 3).map((m) => (
              <Link
                key={m.id}
                to="/student/material"
                className="card flex items-center gap-3 transition hover:shadow-md active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <BookIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{m.title}</span>
                  <span className="block truncate text-xs text-slate-500">
                    {m.subject} · {m.topic}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">{formatRelative(m.uploadedAt)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="animate-fade-up">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Recent announcements</h2>
          <Link to="/student/notifications" className="text-xs font-semibold text-brand-600">
            See all
          </Link>
        </div>
        {notifications.length === 0 ? (
          <p className="card text-sm text-slate-500">No announcements right now.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="card">
                <div className="mb-1 flex items-center gap-2">
                  <BellIcon className="h-4 w-4 shrink-0 text-brand-600" />
                  <span className="truncate font-semibold text-slate-900">{n.title}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-400">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm text-slate-600">{n.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
