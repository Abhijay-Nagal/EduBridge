# EduBridge — Project Plan

A lightweight LMS + institute-management platform for small-scale tuition centers and coaching institutes, where full-fledged LMS products (Google Classroom, Moodle, etc.) are overkill, unaffordable, or don't fit the workflow (WhatsApp/call-based communication, manual fee collection, single-teacher operations).

---

## 1. Problem Statement

Small tuition centers/coaching institutes (1–10 teachers, 20–300 students) currently run on:
- WhatsApp groups for announcements and fee reminders
- Phone calls for attendance/absence notices
- Physical notebooks/registers for attendance, fees, and progress
- Paper or PDF study material shared ad-hoc

This is error-prone, not searchable, gives parents no real visibility into their child's academic standing, and consumes teacher time on repetitive communication (fee reminders, "class cancelled today" messages).

EduBridge centralizes this into one app with three role-based logins, replacing scattered communication with structured, persistent, per-user data.

---

## 2. User Personas & Core Features

### 2.1 Student
- Personalized dashboard: topics covered, upcoming topics, subject-wise notes/study material
- Download/view study material (PDFs, images, links, videos)
- Take quizzes/tests assigned by admin, view scores/attempt history
- Notifications feed: class cancellations, schedule changes, exam dates, general announcements
- View own attendance record
- View own report cards / remarks (read-only, mirrors what admin publishes)

### 2.2 Parent
- Linked to one or more children (multi-child support for siblings in the same institute)
- View attendance (daily/monthly, % summary)
- View progress reports, test/quiz scores, trends over time
- View teacher remarks / report cards
- Receive fee due/overdue notifications
- Receive the same broadcast notifications as students (class cancelled, holiday, etc.) — optionally filtered to "parent-relevant" only
- Read-only access — no editing capability, this is intentional (integrity of academic records)

### 2.3 Administration (Teacher/Owner)
- Manage students & parents: create accounts, link parent↔student, batch/class assignment
- Upload study material (per subject/batch/topic)
- Create & publish quizzes/tests (MCQ at minimum; short-answer optional later), auto-grading for objective types
- Post notifications — targeted (specific batch/student) or broadcast (all)
- Mark attendance (daily, per batch)
- Enter/update report cards, remarks, marks
- Fee management: define fee structure per student, mark payments, auto-generate reminders for due/overdue fees
- Basic analytics: attendance trends, quiz performance, fee collection status

---

## 3. Suggestions & Design Decisions Worth Considering

These aren't in your original description but are natural extensions or risks worth deciding on now, before coding:

1. **Multi-tenancy from day one.** Even if you only pilot with one coaching center, model the data as `Institute → Batches → Students` rather than a single global set of users. This costs little extra effort now and means the same codebase can later serve multiple institutes (a real product, not just a class project) without a rewrite.
2. **Notifications delivery channel.** In-app notifications alone won't beat WhatsApp habits for parents who may not open the app daily. Consider (as a stretch goal, not MVP): push notifications (web push / FCM) at minimum, and optionally a WhatsApp Business API or Twilio SMS integration for fee reminders specifically, since that's explicitly your stated pain point. This can be phased in after the core CRUD app works.
3. **Attendance entry UX.** For a teacher marking attendance for 30+ students daily, this must be fast — a single-screen checklist/toggle grid per batch, not a multi-click form per student. Worth prototyping this screen early.
4. **Fee reminders as a scheduled job, not manual.** Admin sets a due date once per student/fee-cycle; a background job (cron) auto-generates the "fee due in 3 days" / "fee overdue" notification rather than the teacher remembering to send it. This is the single highest-value automation in your idea — it directly replaces the manual call/WhatsApp reminder.
5. **Report cards: structured data > uploaded PDFs.** Store marks/remarks as structured fields (subject, marks, max marks, remark text) so you can compute trends/graphs for parents, rather than just uploading a scanned PDF. You can still offer a "download as PDF" export generated from structured data.
6. **Offline/low-bandwidth consideration.** Target audience (small towns, budget phones) may have patchy internet. A responsive, lightweight web app (or PWA with installability) is more practical than a heavy native app initially — reduces both your dev effort and user friction.
7. **Auth simplicity over security theater.** Parents/students in this context often share one phone or forget passwords easily. Consider phone-number + OTP login (via a cheap SMS gateway) instead of email/password, or at minimum a simple "forgot password via admin reset" flow, since there's no self-service email recovery culture in this user base.
8. **Parent account creation.** Decide who creates parent accounts — admin creates and shares credentials (recommended for this audience, avoids parents fumbling signup), vs. self-signup with an invite code from admin.
9. **Quiz question bank reuse.** Even a simple "save question to bank, reuse across quizzes" feature saves teachers significant repeated effort.
10. **Roles are fixed but data model should allow one person to have both roles.** E.g., an admin who is also a parent of a student elsewhere, or a student who becomes a teaching assistant later — not urgent, but keep the schema from hard-coding "one role per user ever."
11. **Audit trail on attendance/marks edits.** Since parents rely on this data being accurate, log who changed what attendance/marks record and when — catches disputes ("teacher said I was present") without needing a heavy audit system, just a `modified_by`/`modified_at` + optional change log.

---

## 4. Final Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + Tailwind CSS | Fast to build, huge ecosystem, easy to make responsive/PWA |
| Backend | Node.js + Express (JavaScript, no TypeScript) | Same language as frontend — one skillset for the whole team, less setup overhead for a deadline-bound project |
| Database | PostgreSQL on **Supabase** (free tier) | Relational data (students↔parents↔batches↔fees) fits relational model well |
| File storage | **Supabase Storage** | Same provider as the DB — study material, PDFs, report card exports |
| Auth | JWT-based sessions, role field in user table (`student` / `parent` / `admin`) | One `users` table with a `role` column and role-specific profile tables — not three separate codebases |
| Notifications | In-app (DB-backed) for MVP; add Web Push or Twilio/WhatsApp Cloud API later | Ship the core value first, add channels incrementally |
| Hosting | Frontend on **Vercel**, backend on **Render** | Free tiers, straightforward deploys from GitHub |

**Language:** JavaScript end-to-end (frontend, backend), plus SQL for the database. No TypeScript.

> Since both the database and file storage live on Supabase, consider using the **Supabase client SDK** directly from the Express backend for auth/DB/storage access instead of wiring up `pg` and a separate storage SDK — fewer moving parts.

> Note: "three authentication systems" is better implemented as **one authentication system with three roles**, not three separate codebases — simpler to build, secure, and maintain, and still gives each role its own dashboard/permissions via role-based access control (RBAC).

---

## 5. Core Data Model (high-level)

```
Institute
 └─ Batch (e.g. "Class 10 - Batch A", subject/timing)
     └─ enrolls → Student

User (id, name, phone/email, password_hash, role: student|parent|admin)
Student (user_id, batch_id, roll_no, ...)
Parent (user_id) ↔ ParentStudentLink (parent_id, student_id)  [many-to-many for multiple kids/guardians]
Admin (user_id, institute_id)

StudyMaterial (id, batch_id, subject, title, file_url, uploaded_by, uploaded_at)
Quiz (id, batch_id, title, questions[], published_at, due_at)
QuizAttempt (id, quiz_id, student_id, answers[], score, attempted_at)

Attendance (id, student_id, batch_id, date, status: present|absent|late, marked_by)
ReportCard / Marks (id, student_id, term, subject, marks, max_marks, remark, entered_by)

FeeStructure (student_id, amount, due_date, cycle)
FeePayment (id, student_id, amount_paid, paid_on, mode)
Notification (id, institute_id, batch_id?/student_id?, title, body, type, created_by, created_at)
```

---

## 6. Suggested Build Phases

**Phase 1 — MVP (core value, gets a working demo)**
- Auth (3 roles) + admin can create student/parent accounts and link them
- Admin: batch management, study material upload, notification posting
- Student: dashboard with material + notifications
- Parent: view attendance + report card (read-only)
- Attendance marking (admin)
- Basic report card entry (admin) → parent/student view

**Phase 2 — Engagement features**
- Quizzes (create, attempt, auto-grade objective questions)
- Fee structure + manual reminder posting
- Analytics dashboard for admin (attendance %, quiz averages)

**Phase 3 — Automation & reach**
- Scheduled/automated fee reminders (cron job)
- Push notifications / WhatsApp or SMS integration
- PDF export of report cards
- Multi-institute support (if turning this into a real product beyond the course project)

---

## 7. Open Questions to Settle Before Coding

- Web app, or does it need to be a mobile app (React Native/Flutter) for the student/parent side specifically?
- Any fixed deadline/deliverable format from the subject (demo, working prototype, report) that should shape scope?
- Will you pilot this with a real coaching institute, or is it a self-contained academic demo with seed data?

---

*Next step: once the stack and scope for Phase 1 are confirmed, break down Phase 1 into a sprint-level task list and start scaffolding the repo (auth + data model first).*
