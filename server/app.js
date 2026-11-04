// EduBridge REST API.
//
// Express + PostgreSQL. Authentication is a bcrypt password check that issues
// a JWT; every route below /api (except login) requires that token, and write
// routes are restricted by role.
//
// This module only builds the app. server/index.js runs it as a normal server
// for local development; api/index.js exposes it as a Vercel serverless function.

import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { getInstitute, init, one, q, resetDemoData, snapshotFor, tx, uid } from './db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'edubridge-dev-secret'

const app = express()
app.use(express.json({ limit: '1mb' }))

// Request log — handy to show during a demo that the UI really talks to the API.
app.use('/api', (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`))
  next()
})

// Make sure the database is connected and seeded before any route runs.
app.use('/api', async (req, res, next) => {
  try {
    await init()
    next()
  } catch (err) {
    console.error(err)
    res.status(503).json({ error: 'The database is not available right now.' })
  }
})

// Wrap handlers so thrown errors become JSON responses instead of crashes.
const h = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res)
    if (!res.headersSent) res.json(out ?? { ok: true })
  } catch (err) {
    const duplicate = err.code === '23505'
    const status = err.status || (duplicate ? 409 : 500)
    const message = duplicate ? 'That phone number is already registered.' : err.message
    if (status === 500) console.error(err)
    res.status(status).json({ error: message })
  }
}

const fail = (status, message) => Object.assign(new Error(message), { status })
const now = () => new Date().toISOString()
const required = (body, ...fields) => {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') throw fail(400, `Missing field: ${f}`)
  }
}

// ---------- auth ----------

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Please sign in again.' })
  }
}

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Not allowed for your role.' })

app.get('/api/health', h(async () => ({ ok: true, time: now(), users: (await one('SELECT COUNT(*)::int AS n FROM users')).n })))
app.get('/api/institute', h(() => getInstitute()))

app.post('/api/auth/login', h(async (req) => {
  const { loginId = '', password = '' } = req.body
  const row = await one('SELECT * FROM users WHERE login_id = ?', String(loginId).trim())
  if (!row || !bcrypt.compareSync(String(password), row.password_hash)) {
    throw fail(401, 'Incorrect phone number or password.')
  }
  const user = { id: row.id, name: row.name, role: row.role, loginId: row.login_id }
  return { token: jwt.sign(user, JWT_SECRET, { expiresIn: '30d' }), user }
}))

// Forgot password: the request creates a 6-digit code that admins see on the
// People page and pass on to the user, who then sets a new password with it.
const RESET_TTL_MS = 15 * 60 * 1000
const RESET_MAX_ATTEMPTS = 5

app.post('/api/auth/forgot', h(async (req) => {
  const loginId = String(req.body.loginId || '').trim()
  if (!loginId) throw fail(400, 'Enter your phone number.')
  const row = await one('SELECT id FROM users WHERE login_id = ?', loginId)
  // Same answer either way, so the endpoint does not reveal which numbers exist.
  if (row) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    const expires = new Date(Date.now() + RESET_TTL_MS).toISOString()
    await q(
      `INSERT INTO password_resets VALUES (?, ?, 0, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, attempts = 0,
         expires_at = EXCLUDED.expires_at, created_at = EXCLUDED.created_at`,
      row.id, code, expires, now(),
    )
  }
  return { ok: true }
}))

app.post('/api/auth/reset', h(async (req) => {
  const loginId = String(req.body.loginId || '').trim()
  const code = String(req.body.code || '').trim()
  const password = String(req.body.password || '')
  if (password.length < 6) throw fail(400, 'Use at least 6 characters for the new password.')
  const row = await one(
    'SELECT r.* FROM password_resets r JOIN users u ON u.id = r.user_id WHERE u.login_id = ?',
    loginId,
  )
  if (!row || row.expires_at < now() || row.attempts >= RESET_MAX_ATTEMPTS) {
    throw fail(400, 'This reset code has expired. Request a new one.')
  }
  if (row.code !== code) {
    await q('UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = ?', row.user_id)
    throw fail(400, 'That code is not correct.')
  }
  await tx(async (q) => {
    await q('UPDATE users SET password_hash = ? WHERE id = ?', bcrypt.hashSync(password, 8), row.user_id)
    await q('DELETE FROM password_resets WHERE user_id = ?', row.user_id)
  })
}))

app.use('/api', auth)

app.get('/api/me', h(async (req) => {
  // The token may outlive the account (e.g. after a demo reset).
  if (!(await one('SELECT 1 FROM users WHERE id = ?', req.user.id))) throw fail(401, 'Please sign in again.')
  const { id, name, role, loginId } = req.user
  return { id, name, role, loginId }
}))
app.get('/api/bootstrap', h((req) => snapshotFor(req.user)))

const admin = requireRole('admin')

// ---------- people & batches ----------

app.post('/api/batches', admin, h(async (req) => {
  required(req.body, 'name')
  const { name, subject, timing } = req.body
  const id = uid('b')
  await q('INSERT INTO batches VALUES (?, ?, ?, ?)', id, name, subject, timing)
  return { id, name, subject, timing }
}))

app.delete('/api/batches/:id', admin, h(async (req) => {
  if (await one('SELECT 1 FROM students WHERE batch_id = ?', req.params.id)) {
    throw fail(409, 'This batch still has students enrolled.')
  }
  await q('DELETE FROM batches WHERE id = ?', req.params.id)
}))

app.post('/api/students', admin, h(async (req) => {
  required(req.body, 'name', 'loginId', 'password', 'batchId', 'rollNo')
  const { name, loginId, password, batchId, rollNo } = req.body
  return tx(async (q) => {
    const userId = uid('u')
    const id = uid('st')
    await q('INSERT INTO users VALUES (?, ?, ?, ?, ?)', userId, name, loginId, bcrypt.hashSync(password, 8), 'student')
    await q('INSERT INTO students VALUES (?, ?, ?, ?)', id, userId, batchId, rollNo)
    return { id, userId, batchId, rollNo }
  })
}))

// Deleting the user row cascades to the student and all of their records.
app.delete('/api/students/:id', admin, h(async (req) => {
  const st = await one('SELECT user_id FROM students WHERE id = ?', req.params.id)
  if (!st) throw fail(404, 'Student not found.')
  await q('DELETE FROM users WHERE id = ?', st.user_id)
}))

app.post('/api/parents', admin, h(async (req) => {
  required(req.body, 'name', 'loginId', 'password')
  const { name, loginId, password, studentIds = [] } = req.body
  return tx(async (q) => {
    const userId = uid('u')
    const id = uid('pa')
    await q('INSERT INTO users VALUES (?, ?, ?, ?, ?)', userId, name, loginId, bcrypt.hashSync(password, 8), 'parent')
    await q('INSERT INTO parents VALUES (?, ?)', id, userId)
    for (const studentId of studentIds) await q('INSERT INTO parent_links VALUES (?, ?)', id, studentId)
    return { id, userId }
  })
}))

// ---------- study material ----------

app.post('/api/materials', admin, h(async (req) => {
  required(req.body, 'title', 'subject', 'kind', 'batchId')
  const m = req.body
  const id = uid('m')
  await q(
    'INSERT INTO materials VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, m.batchId, m.subject, m.topic, m.title, m.kind, m.body, m.url, req.user.id, now(),
  )
  return { id }
}))

app.delete('/api/materials/:id', admin, h(async (req) => {
  await q('DELETE FROM materials WHERE id = ?', req.params.id)
}))

// ---------- quizzes ----------

app.post('/api/quizzes', admin, h(async (req) => {
  required(req.body, 'title', 'subject', 'batchId', 'questions')
  const quiz = req.body
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) throw fail(400, 'A quiz needs at least one question.')
  return tx(async (q) => {
    const id = uid('q')
    await q('INSERT INTO quizzes VALUES (?, ?, ?, ?, ?, ?)', id, quiz.batchId, quiz.subject, quiz.title, now(), quiz.dueAt)
    for (const [i, qq] of quiz.questions.entries()) {
      await q(
        'INSERT INTO quiz_questions VALUES (?, ?, ?, ?, ?, ?, ?)',
        `${uid('qq')}-${i}`, id, i, qq.text, JSON.stringify(qq.options), Number(qq.correctIndex), 1,
      )
    }
    return { id }
  })
}))

app.delete('/api/quizzes/:id', admin, h(async (req) => {
  await q('DELETE FROM quizzes WHERE id = ?', req.params.id)
}))

// Grading happens here, not in the browser — students never receive the
// answer key until they have submitted.
app.post('/api/quizzes/:id/attempts', requireRole('student'), h(async (req) => {
  const student = await one('SELECT id FROM students WHERE user_id = ?', req.user.id)
  const quiz = await one('SELECT id FROM quizzes WHERE id = ?', req.params.id)
  if (!student || !quiz) throw fail(404, 'Quiz not found.')
  if (await one('SELECT 1 FROM quiz_attempts WHERE quiz_id = ? AND student_id = ?', quiz.id, student.id)) {
    throw fail(409, 'You have already attempted this quiz.')
  }
  const answers = req.body.answers || {}
  const questions = await q('SELECT id, correct_index, marks FROM quiz_questions WHERE quiz_id = ?', quiz.id)
  let score = 0
  for (const qq of questions) if (answers[qq.id] === qq.correct_index) score += qq.marks
  const maxScore = questions.reduce((sum, qq) => sum + qq.marks, 0)
  const attempt = { id: uid('at'), quizId: quiz.id, studentId: student.id, answers, score, maxScore, attemptedAt: now() }
  await q(
    'INSERT INTO quiz_attempts VALUES (?, ?, ?, ?, ?, ?, ?)',
    attempt.id, quiz.id, student.id, JSON.stringify(answers), score, maxScore, attempt.attemptedAt,
  )
  return attempt
}))

// ---------- attendance ----------

// Replaces the whole register for one batch on one date.
app.put('/api/attendance/:batchId/:date', admin, h(async (req) => {
  const { batchId, date } = req.params
  const statuses = req.body.statuses || {}
  await tx(async (q) => {
    await q('DELETE FROM attendance WHERE batch_id = ? AND date = ?', batchId, date)
    for (const [studentId, status] of Object.entries(statuses)) {
      await q('INSERT INTO attendance VALUES (?, ?, ?, ?, ?, ?)', uid('att'), studentId, batchId, date, status, req.user.id)
    }
  })
}))

// ---------- marks ----------

app.post('/api/marks', admin, h(async (req) => {
  required(req.body, 'studentId', 'term', 'subject', 'marks', 'maxMarks')
  const m = req.body
  const id = uid('mk')
  await q(
    'INSERT INTO marks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    id, m.studentId, m.term, m.subject, Number(m.marks), Number(m.maxMarks), m.remark, req.user.id, now(),
  )
  return { id }
}))

app.delete('/api/marks/:id', admin, h(async (req) => {
  await q('DELETE FROM marks WHERE id = ?', req.params.id)
}))

// ---------- fees ----------

app.post('/api/fees', admin, h(async (req) => {
  required(req.body, 'studentId', 'amount', 'dueDate')
  const f = req.body
  const id = uid('f')
  await q('INSERT INTO fees VALUES (?, ?, ?, ?, ?, ?)', id, f.studentId, Number(f.amount), f.dueDate, f.cycle, 'due')
  return { id }
}))

app.post('/api/fees/:id/payments', admin, h(async (req) => {
  const fee = await one('SELECT * FROM fees WHERE id = ?', req.params.id)
  if (!fee) throw fail(404, 'Fee entry not found.')
  await tx(async (q) => {
    await q("UPDATE fees SET status = 'paid' WHERE id = ?", fee.id)
    await q(
      'INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?)',
      uid('pay'), fee.id, fee.student_id, fee.amount, now().slice(0, 10), req.body.mode,
    )
  })
}))

// ---------- notifications ----------

app.post('/api/notifications', admin, h(async (req) => {
  required(req.body, 'title', 'audience')
  const n = req.body
  const id = uid('n')
  await q(
    'INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    id, n.title, n.body, n.type, n.audience, n.batchId || null, req.user.id, now(),
  )
  return { id }
}))

app.delete('/api/notifications/:id', admin, h(async (req) => {
  await q('DELETE FROM notifications WHERE id = ?', req.params.id)
}))

// The client sends the ids it is showing; the server records them as read.
app.post('/api/notifications/read', h(async (req) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : []
  await tx(async (q) => {
    for (const id of ids) {
      await q('INSERT INTO notification_reads VALUES (?, ?, ?) ON CONFLICT DO NOTHING', req.user.id, id, now())
    }
  })
}))

// ---------- password resets ----------

app.get('/api/password-resets', admin, h(async () => {
  const rows = await q(
    `SELECT u.name, u.login_id, u.role, r.code, r.expires_at FROM password_resets r
     JOIN users u ON u.id = r.user_id
     WHERE r.expires_at > ? AND r.attempts < ? ORDER BY r.created_at DESC`,
    now(), RESET_MAX_ATTEMPTS,
  )
  return rows.map((r) => ({ name: r.name, loginId: r.login_id, role: r.role, code: r.code, expiresAt: r.expires_at }))
}))

// ---------- demo helper ----------

app.post('/api/admin/reset', admin, h(() => resetDemoData()))

app.use('/api', (req, res) => res.status(404).json({ error: 'No such endpoint.' }))

export default app
