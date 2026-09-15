import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAttempt, getStudentRecord, listQuizzes } from '../../data/db'
import { CheckIcon, ChevronRightIcon, ClockIcon, QuizIcon } from '../../components/Icons'
import { Badge, EmptyState, PageHeader, ProgressBar, formatDate } from '../../components/ui'

export default function StudentQuizzes() {
  const { user } = useAuth()
  const student = getStudentRecord(user.id)
  const quizzes = listQuizzes({ batchId: student.batchId })

  const pending = quizzes.filter((q) => !getAttempt(q.id, student.id))
  const completed = quizzes.filter((q) => getAttempt(q.id, student.id))

  return (
    <div>
      <PageHeader title="Quizzes" subtitle="Tests assigned to your batch" />

      {quizzes.length === 0 ? (
        <EmptyState icon={QuizIcon} title="No quizzes yet" hint="New tests will show up here." />
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h2 className="section-title mb-2">To attempt ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((quiz) => {
                  const overdue = new Date(quiz.dueAt) < new Date()
                  return (
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
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge tone="brand">{quiz.subject}</Badge>
                          <Badge tone={overdue ? 'red' : 'slate'}>
                            <ClockIcon className="h-3 w-3" />
                            {overdue ? 'Past due' : `Due ${formatDate(quiz.dueAt)}`}
                          </Badge>
                        </span>
                      </span>
                      <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300" />
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="section-title mb-2">Completed ({completed.length})</h2>
              <div className="space-y-2">
                {completed.map((quiz) => {
                  const attempt = getAttempt(quiz.id, student.id)
                  const percent = Math.round((attempt.score / attempt.maxScore) * 100)
                  return (
                    <Link
                      key={quiz.id}
                      to={`/student/quizzes/${quiz.id}`}
                      className="card block transition hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckIcon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{quiz.title}</p>
                          <p className="text-xs text-slate-500">{quiz.subject}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-extrabold text-slate-900">
                            {attempt.score}
                            <span className="text-sm font-medium text-slate-400">/{attempt.maxScore}</span>
                          </p>
                          <p className="text-xs text-slate-400">{percent}%</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <ProgressBar
                          value={percent}
                          tone={percent >= 75 ? 'green' : percent >= 40 ? 'amber' : 'red'}
                        />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
