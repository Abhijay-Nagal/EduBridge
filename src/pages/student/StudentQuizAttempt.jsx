import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAttempt, getQuiz, getStudentRecord, submitAttempt } from '../../data/db'
import { ArrowLeftIcon, CheckIcon, XIcon } from '../../components/Icons'
import { Badge, ProgressBar, ProgressRing } from '../../components/ui'
import Mascot from '../../components/Mascot'
import Confetti from '../../components/Confetti'

export default function StudentQuizAttempt() {
  const { quizId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const student = getStudentRecord(user.id)
  const quiz = getQuiz(quizId)

  const existing = quiz ? getAttempt(quiz.id, student.id) : null
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!quiz) {
    return (
      <div className="card text-center">
        <p className="font-semibold text-slate-700">Quiz not found.</p>
        <Link to="/student/quizzes" className="btn-ghost mt-3">
          Back to quizzes
        </Link>
      </div>
    )
  }

  if (existing) return <QuizResult quiz={quiz} attempt={existing} />

  const answered = Object.keys(answers).length
  const total = quiz.questions.length

  const submit = async () => {
    if (answered < total) {
      setError(`Please answer all ${total} questions. ${total - answered} left.`)
      return
    }
    setSubmitting(true)
    await submitAttempt(quiz.id, student.id, answers)
    setSubmitting(false)
    navigate(`/student/quizzes/${quiz.id}`, { replace: true })
  }

  return (
    <div>
      <button onClick={() => navigate('/student/quizzes')} className="btn-ghost mb-4 px-3 py-2 text-xs">
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="card mb-4 animate-fade-up">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{quiz.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="brand">{quiz.subject}</Badge>
          <Badge tone="slate">{total} questions</Badge>
          <Badge tone="slate">{total} marks</Badge>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-500">
            <span>Progress</span>
            <span>
              {answered} / {total}
            </span>
          </div>
          <ProgressBar value={(answered / total) * 100} />
        </div>
      </div>

      <div className="space-y-3">
        {quiz.questions.map((q, index) => (
          <article key={q.id} className="card animate-fade-up">
            <p className="mb-3 font-semibold text-slate-900">
              <span className="mr-1.5 text-brand-600">Q{index + 1}.</span>
              {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optionIndex) => {
                const selected = answers[q.id] === optionIndex
                return (
                  <button
                    key={optionIndex}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [q.id]: optionIndex }))
                      setError('')
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition active:scale-[0.99] ${
                      selected
                        ? 'bg-brand-600 font-semibold text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        selected ? 'bg-white/20' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                      }`}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700">{error}</p>
      )}

      <button onClick={submit} className="btn-primary mt-4 w-full py-3.5" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit quiz'}
      </button>
      <p className="mt-2 text-center text-xs text-slate-400">
        You can only attempt this quiz once.
      </p>
    </div>
  )
}

function QuizResult({ quiz, attempt }) {
  const navigate = useNavigate()
  const percent = Math.round((attempt.score / attempt.maxScore) * 100)
  const tone = percent >= 75 ? 'green' : percent >= 40 ? 'amber' : 'red'

  // Only celebrate a genuinely good score, and only briefly.
  const [celebrate, setCelebrate] = useState(percent >= 75)
  useEffect(() => {
    if (!celebrate) return
    const t = setTimeout(() => setCelebrate(false), 2800)
    return () => clearTimeout(t)
  }, [celebrate])

  // A one-shot celebration, then the mascot settles. `think` is a resting pose
  // so it is fine to hold for a weak score.
  const restingMood = percent >= 40 ? 'idle' : 'think'
  const greetGesture = percent >= 75 ? 'cheer' : percent >= 40 ? 'wave' : false
  const line =
    percent >= 75
      ? 'Excellent work. Keep it up!'
      : percent >= 40
        ? 'Decent attempt. Review the ones you missed.'
        : 'Needs work. Go through the material again.'

  return (
    <div>
      {celebrate && <Confetti />}

      <button onClick={() => navigate('/student/quizzes')} className="btn-ghost mb-4 px-3 py-2 text-xs">
        <ArrowLeftIcon className="h-4 w-4" />
        Back
      </button>

      <div className="card animate-pop mb-4 text-center">
        <p className="section-title">Your score</p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Mascot
            size={118}
            mood={restingMood}
            greet={greetGesture}
            interactive
            className="shrink-0"
          />
          <ProgressRing value={percent} size={112} stroke={11} tone={tone}>
            <div className="text-center">
              <p className="text-2xl font-extrabold leading-none text-slate-900">
                {attempt.score}
                <span className="text-sm font-bold text-slate-300">/{attempt.maxScore}</span>
              </p>
              <p className="mt-0.5 text-xs font-bold text-slate-400">{percent}%</p>
            </div>
          </ProgressRing>
        </div>

        <p className="mt-3 text-sm font-medium text-slate-600">{line}</p>
      </div>

      <h2 className="section-title mb-2">Answer review</h2>
      <div className="space-y-3">
        {quiz.questions.map((q, index) => {
          const given = attempt.answers[q.id]
          const correct = given === q.correctIndex
          return (
            <article key={q.id} className="card animate-fade-up">
              <div className="mb-3 flex items-start gap-2">
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${
                    correct ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                >
                  {correct ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                </span>
                <p className="font-semibold text-slate-900">
                  <span className="mr-1.5 text-brand-600">Q{index + 1}.</span>
                  {q.text}
                </p>
              </div>
              <div className="space-y-1.5">
                {q.options.map((option, optionIndex) => {
                  const isCorrect = optionIndex === q.correctIndex
                  const isGiven = optionIndex === given
                  return (
                    <div
                      key={optionIndex}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        isCorrect
                          ? 'bg-emerald-50 font-semibold text-emerald-800'
                          : isGiven
                            ? 'bg-rose-50 font-semibold text-rose-800 line-through'
                            : 'text-slate-500'
                      }`}
                    >
                      <span className="text-xs font-bold">{String.fromCharCode(65 + optionIndex)}</span>
                      <span className="flex-1">{option}</span>
                      {isCorrect && <span className="text-[10px] font-bold uppercase">Correct</span>}
                      {isGiven && !isCorrect && <span className="text-[10px] font-bold uppercase">You</span>}
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
