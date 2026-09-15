// Single data-access layer for EduBridge.
//
// Everything the UI needs goes through this module. Persistence is IndexedDB
// (via idb-keyval) with an in-memory cache, so reads are synchronous for the
// UI while writes are durable. Swapping this file's internals for Supabase
// later does not require touching any component.

import { get, set, del } from 'idb-keyval'
import { buildSeed } from './seed'

const KEY = 'edubridge-db-v1'

let cache = null
const listeners = new Set()

const clone = (v) => JSON.parse(JSON.stringify(v))
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

async function persist() {
  await set(KEY, cache)
  listeners.forEach((fn) => fn())
}

export async function initDb() {
  const stored = await get(KEY)
  cache = stored && stored.version === 1 ? stored : buildSeed()
  if (!stored) await set(KEY, cache)
  return cache
}

export async function resetDb() {
  await del(KEY)
  cache = buildSeed()
  await persist()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const db = () => cache

// ---------- lookups ----------

export const getInstitute = () => db().institute
export const getBatches = () => clone(db().batches)
export const getBatch = (id) => db().batches.find((b) => b.id === id)
export const getUser = (id) => db().users.find((u) => u.id === id)

export function getStudentRecord(userId) {
  return db().students.find((s) => s.userId === userId)
}

export function getParentRecord(userId) {
  return db().parents.find((p) => p.userId === userId)
}

export function studentWithUser(student) {
  const user = getUser(student.userId)
  const batch = getBatch(student.batchId)
  return { ...student, name: user?.name ?? 'Unknown', loginId: user?.loginId, batchName: batch?.name ?? '—' }
}

export function listStudents({ batchId } = {}) {
  return db()
    .students.filter((s) => !batchId || s.batchId === batchId)
    .map(studentWithUser)
    .sort((a, b) => a.rollNo.localeCompare(b.rollNo))
}

export function listParents() {
  return db().parents.map((p) => {
    const user = getUser(p.userId)
    const children = db()
      .parentLinks.filter((l) => l.parentId === p.id)
      .map((l) => db().students.find((s) => s.id === l.studentId))
      .filter(Boolean)
      .map(studentWithUser)
    return { ...p, name: user?.name ?? 'Unknown', loginId: user?.loginId, children }
  })
}

export function childrenOfParent(parentId) {
  return db()
    .parentLinks.filter((l) => l.parentId === parentId)
    .map((l) => db().students.find((s) => s.id === l.studentId))
    .filter(Boolean)
    .map(studentWithUser)
}

// ---------- auth ----------

export function authenticate(loginId, password) {
  const user = db().users.find(
    (u) => u.loginId === loginId.trim() && u.password === password,
  )
  if (!user) return null
  return { id: user.id, name: user.name, role: user.role, loginId: user.loginId }
}

// ---------- study material ----------

export function listMaterials({ batchId } = {}) {
  return db()
    .materials.filter((m) => !batchId || m.batchId === batchId)
    .slice()
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

export async function addMaterial(data) {
  const material = { id: uid('m'), uploadedAt: new Date().toISOString(), ...data }
  db().materials.push(material)
  await persist()
  return material
}

export async function deleteMaterial(id) {
  cache.materials = db().materials.filter((m) => m.id !== id)
  await persist()
}

// ---------- quizzes ----------

export function listQuizzes({ batchId } = {}) {
  return db()
    .quizzes.filter((q) => !batchId || q.batchId === batchId)
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export const getQuiz = (id) => db().quizzes.find((q) => q.id === id)

export function getAttempt(quizId, studentId) {
  return db().attempts.find((a) => a.quizId === quizId && a.studentId === studentId)
}

export function listAttempts(quizId) {
  return db()
    .attempts.filter((a) => a.quizId === quizId)
    .map((a) => {
      const student = db().students.find((s) => s.id === a.studentId)
      return { ...a, student: student ? studentWithUser(student) : null }
    })
}

export async function addQuiz(data) {
  const quiz = {
    id: uid('q'),
    publishedAt: new Date().toISOString(),
    ...data,
    questions: data.questions.map((q, i) => ({ ...q, id: `${uid('qq')}-${i}`, marks: 1 })),
  }
  db().quizzes.push(quiz)
  await persist()
  return quiz
}

export async function deleteQuiz(id) {
  cache.quizzes = db().quizzes.filter((q) => q.id !== id)
  cache.attempts = db().attempts.filter((a) => a.quizId !== id)
  await persist()
}

export async function submitAttempt(quizId, studentId, answers) {
  const quiz = getQuiz(quizId)
  if (!quiz) throw new Error('Quiz not found')

  let score = 0
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctIndex) score += q.marks
  }
  const maxScore = quiz.questions.reduce((sum, q) => sum + q.marks, 0)

  const attempt = {
    id: uid('at'),
    quizId,
    studentId,
    answers,
    score,
    maxScore,
    attemptedAt: new Date().toISOString(),
  }
  db().attempts.push(attempt)
  await persist()
  return attempt
}

// ---------- attendance ----------

export function attendanceFor(studentId) {
  return db()
    .attendance.filter((a) => a.studentId === studentId)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function attendanceOn(batchId, date) {
  return db().attendance.filter((a) => a.batchId === batchId && a.date === date)
}

export function attendanceSummary(studentId) {
  const rows = db().attendance.filter((a) => a.studentId === studentId)
  const present = rows.filter((r) => r.status === 'present').length
  const late = rows.filter((r) => r.status === 'late').length
  const absent = rows.filter((r) => r.status === 'absent').length
  const total = rows.length
  // A late arrival still counts as attendance for the percentage.
  const percent = total ? Math.round(((present + late) / total) * 100) : 0
  return { present, late, absent, total, percent }
}

export async function markAttendance(batchId, date, statusByStudent, markedBy) {
  cache.attendance = db().attendance.filter(
    (a) => !(a.batchId === batchId && a.date === date),
  )
  for (const [studentId, status] of Object.entries(statusByStudent)) {
    cache.attendance.push({
      id: uid('att'),
      studentId,
      batchId,
      date,
      status,
      markedBy,
    })
  }
  await persist()
}

// ---------- marks / report card ----------

export function marksFor(studentId) {
  return db()
    .marks.filter((m) => m.studentId === studentId)
    .slice()
    .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt))
}

export async function addMarks(data) {
  const row = { id: uid('mk'), enteredAt: new Date().toISOString(), ...data }
  db().marks.push(row)
  await persist()
  return row
}

export async function deleteMarks(id) {
  cache.marks = db().marks.filter((m) => m.id !== id)
  await persist()
}

// ---------- fees ----------

export function feesFor(studentId) {
  return db()
    .fees.filter((f) => f.studentId === studentId)
    .slice()
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
}

export function listFees() {
  return db()
    .fees.map((f) => {
      const student = db().students.find((s) => s.id === f.studentId)
      return { ...f, student: student ? studentWithUser(student) : null }
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}

export function feeStats() {
  const all = db().fees
  const collected = all.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
  const pending = all.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0)
  const overdue = all.filter((f) => f.status === 'overdue').length
  return { collected, pending, overdue, total: all.length }
}

export async function addFee(data) {
  const fee = { id: uid('f'), status: 'due', ...data }
  db().fees.push(fee)
  await persist()
  return fee
}

export async function recordPayment(feeId, mode) {
  const fee = db().fees.find((f) => f.id === feeId)
  if (!fee) return
  fee.status = 'paid'
  db().payments.push({
    id: uid('pay'),
    feeId,
    studentId: fee.studentId,
    amount: fee.amount,
    paidOn: new Date().toISOString().slice(0, 10),
    mode,
  })
  await persist()
}

// Refresh overdue flags based on today's date. Called once on app start —
// this is the local stand-in for the scheduled job described in the plan.
export async function refreshOverdueFees() {
  const today = new Date().toISOString().slice(0, 10)
  let changed = false
  for (const fee of db().fees) {
    if (fee.status === 'due' && fee.dueDate < today) {
      fee.status = 'overdue'
      changed = true
    }
  }
  if (changed) await persist()
}

// ---------- notifications ----------

export function listNotifications(user) {
  const all = db()
    .notifications.slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  if (user.role === 'admin') return all

  let batchIds = []
  if (user.role === 'student') {
    const st = getStudentRecord(user.id)
    batchIds = st ? [st.batchId] : []
  } else if (user.role === 'parent') {
    const pa = getParentRecord(user.id)
    batchIds = pa ? childrenOfParent(pa.id).map((c) => c.batchId) : []
  }

  const audienceKey = user.role === 'student' ? 'students' : 'parents'
  return all.filter(
    (n) =>
      (n.audience === 'all' || n.audience === audienceKey) &&
      (n.batchId === null || batchIds.includes(n.batchId)),
  )
}

export function unreadCount(user) {
  const reads = db().reads.filter((r) => r.userId === user.id)
  return listNotifications(user).filter((n) => !reads.some((r) => r.notificationId === n.id)).length
}

export function isRead(userId, notificationId) {
  return db().reads.some((r) => r.userId === userId && r.notificationId === notificationId)
}

export async function markAllRead(user) {
  let changed = false
  for (const n of listNotifications(user)) {
    if (!isRead(user.id, n.id)) {
      db().reads.push({ userId: user.id, notificationId: n.id })
      changed = true
    }
  }
  // Persisting unconditionally would notify subscribers on every visit, which
  // re-triggers the caller's effect and loops.
  if (changed) await persist()
  return changed
}

export async function addNotification(data) {
  const notification = { id: uid('n'), createdAt: new Date().toISOString(), ...data }
  db().notifications.push(notification)
  await persist()
  return notification
}

export async function deleteNotification(id) {
  cache.notifications = db().notifications.filter((n) => n.id !== id)
  cache.reads = db().reads.filter((r) => r.notificationId !== id)
  await persist()
}

// ---------- people management ----------

export async function addStudent({ name, loginId, password, batchId, rollNo }) {
  const userId = uid('u')
  db().users.push({ id: userId, name, loginId, password, role: 'student' })
  const student = { id: uid('st'), userId, batchId, rollNo }
  db().students.push(student)
  await persist()
  return student
}

export async function addParent({ name, loginId, password, studentIds }) {
  const userId = uid('u')
  db().users.push({ id: userId, name, loginId, password, role: 'parent' })
  const parent = { id: uid('pa'), userId }
  db().parents.push(parent)
  for (const studentId of studentIds) {
    db().parentLinks.push({ parentId: parent.id, studentId })
  }
  await persist()
  return parent
}

export async function removeStudent(studentId) {
  const student = db().students.find((s) => s.id === studentId)
  if (!student) return
  cache.students = db().students.filter((s) => s.id !== studentId)
  cache.users = db().users.filter((u) => u.id !== student.userId)
  cache.parentLinks = db().parentLinks.filter((l) => l.studentId !== studentId)
  cache.attendance = db().attendance.filter((a) => a.studentId !== studentId)
  cache.marks = db().marks.filter((m) => m.studentId !== studentId)
  cache.fees = db().fees.filter((f) => f.studentId !== studentId)
  cache.attempts = db().attempts.filter((a) => a.studentId !== studentId)
  await persist()
}

export async function addBatch({ name, subject, timing }) {
  const batch = { id: uid('b'), name, subject, timing }
  db().batches.push(batch)
  await persist()
  return batch
}

export async function removeBatch(batchId) {
  if (db().students.some((s) => s.batchId === batchId)) {
    throw new Error('This batch still has students enrolled.')
  }
  cache.batches = db().batches.filter((b) => b.id !== batchId)
  cache.materials = db().materials.filter((m) => m.batchId !== batchId)
  cache.quizzes = db().quizzes.filter((q) => q.batchId !== batchId)
  await persist()
}
