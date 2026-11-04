// Single data-access layer for EduBridge.
//
// Everything the UI needs goes through this module. Data lives on the
// EduBridge API server (Express + SQLite). After sign-in the server sends a
// snapshot of everything this user is allowed to see, which is held in an
// in-memory cache so reads stay synchronous for the UI. Every write goes to
// the API first, then the snapshot is reloaded so all screens stay in sync.

import { get, set, del } from 'idb-keyval'
import { api, tokenStore } from './api'

// The last snapshot is kept on the device so the installed app can still open
// and show data with no connection. Writes need the server.
const OFFLINE_KEY = 'edubridge-offline-v1'

const empty = (institute = { id: 'inst', name: 'EduBridge', tagline: '' }) => ({
  version: 1,
  institute,
  batches: [],
  users: [],
  students: [],
  parents: [],
  parentLinks: [],
  materials: [],
  quizzes: [],
  attempts: [],
  attendance: [],
  marks: [],
  fees: [],
  payments: [],
  notifications: [],
  reads: [],
})

let cache = empty()
const listeners = new Set()

const clone = (v) => JSON.parse(JSON.stringify(v))
const notify = () => listeners.forEach((fn) => fn())

// Pulls the signed-in user's snapshot from the server into the cache.
export async function reload(user) {
  cache = await api('/bootstrap')
  notify()
  try {
    const saved = user ?? (await get(OFFLINE_KEY))?.user
    if (saved) await set(OFFLINE_KEY, { user: saved, snapshot: cache })
  } catch {
    // Storage blocked — offline viewing just won't be available.
  }
  return cache
}

// Called once on app start. Returns the signed-in user if a saved session is
// still valid, otherwise null.
export async function initDb() {
  try {
    cache = empty(await api('/institute'))
  } catch {
    // Server unreachable — the login screen will say so on submit.
  }
  if (!tokenStore.get()) return null
  try {
    const user = await api('/me')
    await reload(user)
    return user
  } catch (err) {
    // No connection: fall back to the last snapshot saved on this device.
    if (err.status === 0) {
      const offline = await get(OFFLINE_KEY).catch(() => null)
      if (offline?.snapshot) {
        cache = offline.snapshot
        return offline.user
      }
    }
    tokenStore.clear()
    return null
  }
}

export async function resetDb() {
  await api('/admin/reset', { method: 'POST' })
  await reload()
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

export async function login(loginId, password) {
  const { token, user } = await api('/auth/login', { method: 'POST', body: { loginId, password } })
  tokenStore.set(token)
  await reload(user)
  return user
}

export async function requestPasswordReset(loginId) {
  await api('/auth/forgot', { method: 'POST', body: { loginId } })
}

export async function resetPassword(loginId, code, password) {
  await api('/auth/reset', { method: 'POST', body: { loginId, code, password } })
}

export const listPasswordResets = () => api('/password-resets')

export function logout() {
  tokenStore.clear()
  del(OFFLINE_KEY).catch(() => {})
  cache = empty(cache.institute)
  notify()
}

// ---------- study material ----------

export function listMaterials({ batchId } = {}) {
  return db()
    .materials.filter((m) => !batchId || m.batchId === batchId)
    .slice()
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
}

export async function addMaterial(data) {
  const result = await api('/materials', { method: 'POST', body: data })
  await reload()
  return result
}

export async function deleteMaterial(id) {
  const result = await api(`/materials/${id}`, { method: 'DELETE' })
  await reload()
  return result
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
  const result = await api('/quizzes', { method: 'POST', body: data })
  await reload()
  return result
}

export async function deleteQuiz(id) {
  const result = await api(`/quizzes/${id}`, { method: 'DELETE' })
  await reload()
  return result
}

export async function submitAttempt(quizId, studentId, answers) {
  const attempt = await api(`/quizzes/${quizId}/attempts`, { method: 'POST', body: { answers } })
  await reload()
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

export async function markAttendance(batchId, date, statusByStudent) {
  await api(`/attendance/${batchId}/${date}`, { method: 'PUT', body: { statuses: statusByStudent } })
  await reload()
}

// ---------- marks / report card ----------

export function marksFor(studentId) {
  return db()
    .marks.filter((m) => m.studentId === studentId)
    .slice()
    .sort((a, b) => a.enteredAt.localeCompare(b.enteredAt))
}

export async function addMarks(data) {
  const result = await api('/marks', { method: 'POST', body: data })
  await reload()
  return result
}

export async function deleteMarks(id) {
  const result = await api(`/marks/${id}`, { method: 'DELETE' })
  await reload()
  return result
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
  const result = await api('/fees', { method: 'POST', body: data })
  await reload()
  return result
}

export async function recordPayment(feeId, mode) {
  const result = await api(`/fees/${feeId}/payments`, { method: 'POST', body: { mode } })
  await reload()
  return result
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
  const ids = listNotifications(user)
    .filter((n) => !isRead(user.id, n.id))
    .map((n) => n.id)
  // Only hit the server when something changed — reloading notifies
  // subscribers, which would re-trigger the caller's effect and loop.
  if (ids.length === 0) return false
  await api('/notifications/read', { method: 'POST', body: { ids } })
  await reload()
  return true
}

export async function addNotification(data) {
  const result = await api('/notifications', { method: 'POST', body: data })
  await reload()
  return result
}

export async function deleteNotification(id) {
  const result = await api(`/notifications/${id}`, { method: 'DELETE' })
  await reload()
  return result
}

// ---------- people management ----------

export async function addStudent(data) {
  const result = await api('/students', { method: 'POST', body: data })
  await reload()
  return result
}

export async function addParent(data) {
  const result = await api('/parents', { method: 'POST', body: data })
  await reload()
  return result
}

export async function removeStudent(studentId) {
  const result = await api(`/students/${studentId}`, { method: 'DELETE' })
  await reload()
  return result
}

export async function addBatch(data) {
  const result = await api('/batches', { method: 'POST', body: data })
  await reload()
  return result
}

export async function removeBatch(batchId) {
  const result = await api(`/batches/${batchId}`, { method: 'DELETE' })
  await reload()
  return result
}
