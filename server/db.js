// Database access for the EduBridge API.
//
// PostgreSQL everywhere. In production (Vercel) the connection string comes
// from DATABASE_URL — a Neon serverless Postgres database. Locally, with no
// DATABASE_URL set, an embedded Postgres (PGlite) keeps its files under
// server/data/, so `npm run dev` needs no database server or account.
//
// On first connection the schema is created and the demo dataset is loaded.

import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { buildSeed } from '../src/data/seed.js'

const here = dirname(fileURLToPath(import.meta.url))
const SCHEMA = readFileSync(join(here, 'schema.sql'), 'utf8')

// Queries are written with `?` placeholders; Postgres wants $1, $2, …
const numbered = (sql) => {
  let n = 0
  return sql.replace(/\?/g, () => `$${++n}`)
}
const v = (x) => (x === undefined ? null : x)

// A tiny driver-neutral interface: q(sql, ...params) → rows, exec(sql), tx(fn).
async function connect() {
  // Vercel's Neon integration names the variable after a chosen prefix.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.STORAGE_URL
  if (url) {
    const { default: pg } = await import('pg')
    const pool = new pg.Pool({ connectionString: url, max: 5 })
    const runner = (client) => async (sql, ...params) => (await client.query(numbered(sql), params.map(v))).rows
    return {
      q: runner(pool),
      exec: (sql) => pool.query(sql),
      async tx(fn) {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')
          const result = await fn(runner(client))
          await client.query('COMMIT')
          return result
        } catch (err) {
          await client.query('ROLLBACK')
          throw err
        } finally {
          client.release()
        }
      },
    }
  }

  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL is not set. Connect a Neon database to this Vercel project.')
  }
  const { PGlite } = await import('@electric-sql/pglite')
  const dir = process.env.PGLITE_DIR || join(here, 'data', 'pglite')
  mkdirSync(dir, { recursive: true })
  const db = new PGlite(dir)
  const runner = (client) => async (sql, ...params) => (await client.query(numbered(sql), params.map(v))).rows
  return {
    q: runner(db),
    exec: (sql) => db.exec(sql),
    tx: (fn) => db.transaction((t) => fn(runner(t))),
  }
}

let conn = null
let ready = null

// Connects, creates tables and seeds once per process. Safe to await on every request.
export function init() {
  ready ??= (async () => {
    conn = await connect()
    await conn.exec(SCHEMA)
    await conn.tx(async (q) => {
      // Several serverless instances can cold-start at once; only one seeds.
      await q('SELECT pg_advisory_xact_lock(4242)')
      const [{ n }] = await q('SELECT COUNT(*)::int AS n FROM users')
      if (n === 0) await seed(q)
    })
  })().catch((err) => {
    ready = null
    throw err
  })
  return ready
}

export const q = (sql, ...params) => conn.q(sql, ...params)
export const one = async (sql, ...params) => (await conn.q(sql, ...params))[0]
export const tx = (fn) => conn.tx(fn)

export const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

// Wipes every table and reloads the demo dataset.
export async function resetDemoData() {
  await tx(async (q) => {
    await q('SELECT pg_advisory_xact_lock(4242)')
    await q('TRUNCATE institutes, users, batches, notifications CASCADE')
    await seed(q)
  })
}

// ---------- seeding ----------

async function seed(q) {
  const s = buildSeed()
  const json = JSON.stringify
  await q('INSERT INTO institutes VALUES (?, ?, ?)', s.institute.id, s.institute.name, s.institute.tagline)
  for (const u of s.users) {
    await q('INSERT INTO users VALUES (?, ?, ?, ?, ?)', u.id, u.name, u.loginId, bcrypt.hashSync(u.password, 8), u.role)
  }
  for (const b of s.batches) await q('INSERT INTO batches VALUES (?, ?, ?, ?)', b.id, b.name, b.subject, b.timing)
  for (const st of s.students) await q('INSERT INTO students VALUES (?, ?, ?, ?)', st.id, st.userId, st.batchId, st.rollNo)
  for (const p of s.parents) await q('INSERT INTO parents VALUES (?, ?)', p.id, p.userId)
  for (const l of s.parentLinks) await q('INSERT INTO parent_links VALUES (?, ?)', l.parentId, l.studentId)
  for (const m of s.materials) {
    await q(
      'INSERT INTO materials VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      m.id, m.batchId, m.subject, m.topic, m.title, m.kind, m.body, m.url, m.uploadedBy, m.uploadedAt,
    )
  }
  for (const qz of s.quizzes) {
    await q('INSERT INTO quizzes VALUES (?, ?, ?, ?, ?, ?)', qz.id, qz.batchId, qz.subject, qz.title, qz.publishedAt, qz.dueAt)
    for (const [i, qq] of qz.questions.entries()) {
      await q(
        'INSERT INTO quiz_questions VALUES (?, ?, ?, ?, ?, ?, ?)',
        qq.id, qz.id, i, qq.text, json(qq.options), qq.correctIndex, qq.marks,
      )
    }
  }
  for (const a of s.attempts) {
    await q(
      'INSERT INTO quiz_attempts VALUES (?, ?, ?, ?, ?, ?, ?)',
      a.id, a.quizId, a.studentId, json(a.answers), a.score, a.maxScore, a.attemptedAt,
    )
  }
  // Attendance is the bulk of the seed, so it goes in as one multi-row insert.
  const rows = s.attendance.map((a) => [a.id, a.studentId, a.batchId, a.date, a.status, a.markedBy])
  await q(
    `INSERT INTO attendance VALUES ${rows.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}`,
    ...rows.flat(),
  )
  for (const m of s.marks) {
    await q(
      'INSERT INTO marks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      m.id, m.studentId, m.term, m.subject, m.marks, m.maxMarks, m.remark, m.enteredBy, m.enteredAt,
    )
  }
  for (const f of s.fees) await q('INSERT INTO fees VALUES (?, ?, ?, ?, ?, ?)', f.id, f.studentId, f.amount, f.dueDate, f.cycle, f.status)
  for (const p of s.payments) await q('INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?)', p.id, p.feeId, p.studentId, p.amount, p.paidOn, p.mode)
  for (const n of s.notifications) {
    await q(
      'INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      n.id, n.title, n.body, n.type, n.audience, n.batchId, n.createdBy, n.createdAt,
    )
  }
}

// Flip unpaid fees past their due date to overdue. Runs before every
// snapshot — the stand-in for a scheduled job.
export function refreshOverdueFees() {
  const today = new Date().toISOString().slice(0, 10)
  return q("UPDATE fees SET status = 'overdue' WHERE status = 'due' AND due_date < ?", today)
}

// ---------- row mappers (snake_case rows → the camelCase shape the UI uses) ----------

const map = {
  user: (r) => ({ id: r.id, name: r.name, loginId: r.login_id, role: r.role }),
  batch: (r) => ({ id: r.id, name: r.name, subject: r.subject, timing: r.timing }),
  student: (r) => ({ id: r.id, userId: r.user_id, batchId: r.batch_id, rollNo: r.roll_no }),
  parent: (r) => ({ id: r.id, userId: r.user_id }),
  link: (r) => ({ parentId: r.parent_id, studentId: r.student_id }),
  material: (r) => ({
    id: r.id, batchId: r.batch_id, subject: r.subject, topic: r.topic, title: r.title, kind: r.kind,
    ...(r.body != null && { body: r.body }), ...(r.url != null && { url: r.url }),
    uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at,
  }),
  attempt: (r) => ({
    id: r.id, quizId: r.quiz_id, studentId: r.student_id, answers: r.answers,
    score: r.score, maxScore: r.max_score, attemptedAt: r.attempted_at,
  }),
  attendance: (r) => ({
    id: r.id, studentId: r.student_id, batchId: r.batch_id, date: r.date, status: r.status, markedBy: r.marked_by,
  }),
  marks: (r) => ({
    id: r.id, studentId: r.student_id, term: r.term, subject: r.subject, marks: r.marks, maxMarks: r.max_marks,
    remark: r.remark, enteredBy: r.entered_by, enteredAt: r.entered_at,
  }),
  fee: (r) => ({ id: r.id, studentId: r.student_id, amount: r.amount, dueDate: r.due_date, cycle: r.cycle, status: r.status }),
  payment: (r) => ({ id: r.id, feeId: r.fee_id, studentId: r.student_id, amount: r.amount, paidOn: r.paid_on, mode: r.mode }),
  notification: (r) => ({
    id: r.id, title: r.title, body: r.body, type: r.type, audience: r.audience, batchId: r.batch_id,
    createdBy: r.created_by, createdAt: r.created_at,
  }),
  read: (r) => ({ userId: r.user_id, notificationId: r.notification_id }),
}

export const getInstitute = () => one('SELECT id, name, tagline FROM institutes LIMIT 1')

// ---------- role-scoped snapshot ----------
//
// The client keeps an in-memory copy of exactly what the signed-in user is
// allowed to see. Admins get everything; students and parents get only their
// own records, and never see quiz answers before they have attempted a quiz.

export async function snapshotFor(user) {
  await refreshOverdueFees()

  const [
    institute, batches, users, students, parents, parentLinks, materials, quizRows, questionRows,
    attempts, attendance, marks, fees, payments, notifications, reads,
  ] = await Promise.all([
    getInstitute(),
    q('SELECT * FROM batches ORDER BY name'),
    q('SELECT * FROM users'),
    q('SELECT * FROM students'),
    q('SELECT * FROM parents'),
    q('SELECT * FROM parent_links'),
    q('SELECT * FROM materials'),
    q('SELECT * FROM quizzes'),
    q('SELECT * FROM quiz_questions ORDER BY quiz_id, position'),
    q('SELECT * FROM quiz_attempts'),
    q('SELECT * FROM attendance'),
    q('SELECT * FROM marks'),
    q('SELECT * FROM fees'),
    q('SELECT * FROM payments'),
    q('SELECT * FROM notifications'),
    q('SELECT * FROM notification_reads WHERE user_id = ?', user.id),
  ])

  const full = {
    version: 1,
    institute,
    batches: batches.map(map.batch),
    users: users.map(map.user),
    students: students.map(map.student),
    parents: parents.map(map.parent),
    parentLinks: parentLinks.map(map.link),
    materials: materials.map(map.material),
    quizzes: quizRows.map((r) => ({
      id: r.id, batchId: r.batch_id, subject: r.subject, title: r.title, publishedAt: r.published_at, dueAt: r.due_at,
      questions: questionRows
        .filter((qq) => qq.quiz_id === r.id)
        .map((qq) => ({ id: qq.id, text: qq.text, options: qq.options, correctIndex: qq.correct_index, marks: qq.marks })),
    })),
    attempts: attempts.map(map.attempt),
    attendance: attendance.map(map.attendance),
    marks: marks.map(map.marks),
    fees: fees.map(map.fee),
    payments: payments.map(map.payment),
    notifications: notifications.map(map.notification),
    reads: reads.map(map.read),
  }

  if (user.role === 'admin') return full

  let parentRows = []
  let studentIds = []
  if (user.role === 'student') {
    studentIds = full.students.filter((s) => s.userId === user.id).map((s) => s.id)
  } else {
    parentRows = full.parents.filter((p) => p.userId === user.id)
    const parentIds = parentRows.map((p) => p.id)
    studentIds = full.parentLinks.filter((l) => parentIds.includes(l.parentId)).map((l) => l.studentId)
  }

  const mineStudents = full.students.filter((s) => studentIds.includes(s.id))
  const batchIds = mineStudents.map((s) => s.batchId)
  const userIds = [user.id, ...mineStudents.map((s) => s.userId)]
  const mine = (rows) => rows.filter((r) => studentIds.includes(r.studentId))
  const myAttempts = mine(full.attempts)
  const audience = user.role === 'student' ? 'students' : 'parents'

  return {
    ...full,
    users: full.users.filter((u) => userIds.includes(u.id)),
    students: mineStudents,
    parents: parentRows,
    parentLinks: full.parentLinks.filter((l) => parentRows.some((p) => p.id === l.parentId)),
    materials: full.materials.filter((m) => batchIds.includes(m.batchId)),
    quizzes: full.quizzes
      .filter((qz) => batchIds.includes(qz.batchId))
      .map((qz) => {
        const attempted = user.role === 'student' && myAttempts.some((a) => a.quizId === qz.id)
        return attempted ? qz : { ...qz, questions: qz.questions.map(({ correctIndex, ...rest }) => rest) }
      }),
    attempts: myAttempts,
    attendance: mine(full.attendance),
    marks: mine(full.marks),
    fees: mine(full.fees),
    payments: mine(full.payments),
    notifications: full.notifications.filter(
      (n) => (n.audience === 'all' || n.audience === audience) && (n.batchId === null || batchIds.includes(n.batchId)),
    ),
  }
}
