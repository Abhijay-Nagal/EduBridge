import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { getParentRecord, getStudentRecord } from './data/db'
import Layout from './components/Layout'
import Login from './pages/Login'

import {
  BellIcon,
  BookIcon,
  CalendarIcon,
  ChartIcon,
  HomeIcon,
  QuizIcon,
  RupeeIcon,
  UsersIcon,
} from './components/Icons'

import StudentHome from './pages/student/StudentHome'
import StudentMaterial from './pages/student/StudentMaterial'
import StudentQuizzes from './pages/student/StudentQuizzes'
import StudentQuizAttempt from './pages/student/StudentQuizAttempt'
import StudentProgress from './pages/student/StudentProgress'

import ParentHome from './pages/parent/ParentHome'
import ParentAttendance from './pages/parent/ParentAttendance'
import ParentProgress from './pages/parent/ParentProgress'
import ParentFees from './pages/parent/ParentFees'

import AdminHome from './pages/admin/AdminHome'
import AdminPeople from './pages/admin/AdminPeople'
import AdminAttendance from './pages/admin/AdminAttendance'
import AdminContent from './pages/admin/AdminContent'
import AdminFees from './pages/admin/AdminFees'
import AdminMarks from './pages/admin/AdminMarks'

import Notifications from './pages/Notifications'

const studentNav = [
  { to: '/student', label: 'Home', icon: HomeIcon },
  { to: '/student/material', label: 'Material', icon: BookIcon },
  { to: '/student/quizzes', label: 'Quizzes', icon: QuizIcon },
  { to: '/student/progress', label: 'Progress', icon: ChartIcon },
  { to: '/student/notifications', label: 'Alerts', icon: BellIcon, badge: 'notifications' },
]

const parentNav = [
  { to: '/parent', label: 'Home', icon: HomeIcon },
  { to: '/parent/attendance', label: 'Attendance', icon: CalendarIcon },
  { to: '/parent/progress', label: 'Progress', icon: ChartIcon },
  { to: '/parent/fees', label: 'Fees', icon: RupeeIcon },
  { to: '/parent/notifications', label: 'Alerts', icon: BellIcon, badge: 'notifications' },
]

const adminNav = [
  { to: '/admin', label: 'Home', icon: HomeIcon },
  { to: '/admin/people', label: 'People', icon: UsersIcon },
  { to: '/admin/attendance', label: 'Attend', icon: CalendarIcon },
  { to: '/admin/content', label: 'Content', icon: BookIcon },
  { to: '/admin/fees', label: 'Fees', icon: RupeeIcon },
  { to: '/admin/notifications', label: 'Alerts', icon: BellIcon, badge: 'notifications' },
]

function Splash() {
  return (
    <div className="grid min-h-full place-items-center bg-brand-700">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white" />
        <p className="text-sm font-semibold tracking-wide">EduBridge</p>
      </div>
    </div>
  )
}

function ForceLogout() {
  const { logout } = useAuth()
  useEffect(() => {
    logout()
  }, [logout])
  return <Navigate to="/login" replace />
}

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />

  // The profile row can disappear if an admin removes this person while they
  // are signed in. Sign them out rather than rendering a broken screen.
  const orphaned =
    (user.role === 'student' && !getStudentRecord(user.id)) ||
    (user.role === 'parent' && !getParentRecord(user.id))

  if (orphaned) return <ForceLogout />

  return children
}

export default function App() {
  const { ready, user } = useAuth()

  if (!ready) return <Splash />

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />}
      />

      <Route
        path="/student"
        element={
          <RequireRole role="student">
            <Layout nav={studentNav} />
          </RequireRole>
        }
      >
        <Route index element={<StudentHome />} />
        <Route path="material" element={<StudentMaterial />} />
        <Route path="quizzes" element={<StudentQuizzes />} />
        <Route path="quizzes/:quizId" element={<StudentQuizAttempt />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/parent"
        element={
          <RequireRole role="parent">
            <Layout nav={parentNav} />
          </RequireRole>
        }
      >
        <Route index element={<ParentHome />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="progress" element={<ParentProgress />} />
        <Route path="fees" element={<ParentFees />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <Layout nav={adminNav} />
          </RequireRole>
        }
      >
        <Route index element={<AdminHome />} />
        <Route path="people" element={<AdminPeople />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="marks" element={<AdminMarks />} />
        <Route path="fees" element={<AdminFees />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? `/${user.role}` : '/login'} replace />} />
    </Routes>
  )
}
