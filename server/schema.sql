-- EduBridge relational schema (PostgreSQL).
--
-- One users table with a role column, plus role-specific profile tables.
-- Foreign keys cascade so removing a student or quiz cleans up everything
-- that hangs off it in a single statement.

CREATE TABLE IF NOT EXISTS institutes (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  tagline TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  login_id      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'student', 'parent'))
);

CREATE TABLE IF NOT EXISTS batches (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  subject TEXT,
  timing  TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id       TEXT PRIMARY KEY,
  user_id  TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
  roll_no  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS parents (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

-- Many-to-many: a parent may have several children, a child several guardians.
CREATE TABLE IF NOT EXISTS parent_links (
  parent_id  TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  PRIMARY KEY (parent_id, student_id)
);

CREATE TABLE IF NOT EXISTS materials (
  id          TEXT PRIMARY KEY,
  batch_id    TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL,
  topic       TEXT,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('note', 'link')),
  body        TEXT,
  url         TEXT,
  uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
  id           TEXT PRIMARY KEY,
  batch_id     TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  subject      TEXT NOT NULL,
  title        TEXT NOT NULL,
  published_at TEXT NOT NULL,
  due_at       TEXT
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id            TEXT PRIMARY KEY,
  quiz_id       TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL,
  text          TEXT NOT NULL,
  options       JSONB NOT NULL,
  correct_index INTEGER NOT NULL,
  marks         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id           TEXT PRIMARY KEY,
  quiz_id      TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id   TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL,
  score        INTEGER NOT NULL,
  max_score    INTEGER NOT NULL,
  attempted_at TEXT NOT NULL,
  UNIQUE (quiz_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_id   TEXT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  date       TEXT NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (student_id, date)
);

CREATE TABLE IF NOT EXISTS marks (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  marks      DOUBLE PRECISION NOT NULL,
  max_marks  DOUBLE PRECISION NOT NULL,
  remark     TEXT,
  entered_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  entered_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fees (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount     DOUBLE PRECISION NOT NULL,
  due_date   TEXT NOT NULL,
  cycle      TEXT,
  status     TEXT NOT NULL CHECK (status IN ('due', 'overdue', 'paid'))
);

CREATE TABLE IF NOT EXISTS payments (
  id         TEXT PRIMARY KEY,
  fee_id     TEXT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount     DOUBLE PRECISION NOT NULL,
  paid_on    TEXT NOT NULL,
  mode       TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT,
  type       TEXT,
  audience   TEXT NOT NULL CHECK (audience IN ('all', 'students', 'parents')),
  batch_id   TEXT REFERENCES batches(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_reads (
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  read_at         TEXT NOT NULL,
  PRIMARY KEY (user_id, notification_id)
);

-- One pending password reset per user. The code is relayed by the admin (the
-- institute has no SMS gateway), so it is short-lived and attempt-limited.
CREATE TABLE IF NOT EXISTS password_resets (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
