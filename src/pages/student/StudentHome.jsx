import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  attendanceSummary,
  getAttempt,
  getBatch,
  getStudentRecord,
  listMaterials,
  listNotifications,
  listQuizzes,
  marksFor,
} from '../../data/db'
import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  ChevronRightIcon,
  QuizIcon,
} from '../../components/Icons'
import { Badge, ProgressRing, StatCard, formatRelative } from '../../components/ui'
import Mascot, { MascotSays } from '../../components/Mascot'

export default function StudentHome() {
  const { user } = useAuth()
  const student = getStudentRecord(user.id)
  const batch = getBatch(student.batchId)

  const attendance = attendanceSummary(student.id)
  const materials = listMaterials({ batchId: student.batchId })
  const quizzes = listQuizzes({ batchId: student.batchId })
  const pendingQuizzes = quizzes.filter((q) => !getAttempt(q.id, student.id))
  const notifications = listNotifications(user).slice(0, 3)

  const marks = marksFor(student.id)
  const latestTerm = marks.length ? marks[marks.length - 1].term : null
  const termMarks = marks.filter((m) => m.term === latestTerm)
  const termPercent = termMarks.length
    ? Math.round(
        (termMarks.reduce((s, m) => s + m.marks, 0) / termMarks.reduce((s, m) => s + m.maxMarks, 0)) * 100,
      )
    : null

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
            mood={pendingQuizzes.length > 0 ? 'wave' : 'cheer'}
            lookAt
            className="-mb-4 -mr-1 shrink-0"
          />
        </div>
      </section>

      {pendingQuizzes.length > 0 && (
        <MascotSays mood="think" size={74} className="animate-page-in">
          You have{' '}
          <strong>
            {pendingQuizzes.length} quiz{pendingQuizzes.length > 1 ? 'zes' : ''}
          </strong>{' '}
          waiting. Want to knock one out?
        </MascotSays>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Attendance"
          value={`${attendance.percent}%`}
          sub={`${attendance.present + attendance.late} of ${attendance.total} classes`}
          tone={attendance.percent >= 75 ? 'green' : 'red'}
          icon={CalendarIcon}
        />
        <StatCard
          label={latestTerm ?? 'Latest test'}
          value={termPercent === null ? '—' : `${termPercent}%`}
          sub={termMarks.length ? `${termMarks.length} subjects` : 'No marks yet'}
          tone="brand"
          icon={ChartIcon}
        />
      </div>

      {pendingQuizzes.length > 0 && (
        <section className="animate-fade-up">
          <h2 className="section-title mb-2">Pending quizzes</h2>
          <div className="space-y-2">
            {pendingQuizzes.map((quiz) => (
              <Link
                key={quiz.id}
                to={`/student/quizzes/${quiz.id}`}
                className="card flex items-center gap-3 transition hover:shadow-md active:scale-[0.99]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
                  <QuizIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-900">{quiz.title}</span>
                  <span className="block text-xs text-slate-500">
                    {quiz.subject} · {quiz.questions.length} questions
                  </span>
                </span>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
              </Link>
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

      <section className="card animate-fade-up">
        <h2 className="mb-3 font-bold text-slate-900">Attendance breakdown</h2>
        <div className="flex items-center gap-4">
          <ProgressRing
            value={attendance.percent}
            tone={attendance.percent >= 75 ? 'green' : 'red'}
          >
            <div className="text-center">
              <p className="text-xl font-extrabold leading-none text-slate-900">
                {attendance.percent}
                <span className="text-xs font-bold text-slate-400">%</span>
              </p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">{attendance.present} present</Badge>
              <Badge tone="amber">{attendance.late} late</Badge>
              <Badge tone="red">{attendance.absent} absent</Badge>
            </div>
            {attendance.percent < 75 ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                Below the 75% requirement.
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                You are comfortably above the 75% requirement.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
