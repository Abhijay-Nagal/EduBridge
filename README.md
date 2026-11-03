# EduBridge

A lightweight, installable LMS for small-scale tuition centres and coaching institutes — the kind of place that runs on WhatsApp groups, phone calls and a paper attendance register today.

Three role-based logins (student, parent, administration) on a single progressive web app.

---

## Demo accounts

The app ships with a realistic demo dataset. On the login screen, tap any of the three cards to auto-fill.

| Role | Phone | Password |
|---|---|---|
| Administration | `9000000001` | `admin123` |
| Student | `9000000010` | `student123` |
| Parent | `9000000020` | `parent123` |

The demo parent (Sunita Gupta) has **two** children enrolled, so the multi-child flow is visible.

---

## Features

**Student**
- Dashboard with attendance %, latest test score, pending quizzes
- Study material browsable by subject (written notes and external links)
- Attempt multiple-choice quizzes with instant auto-grading and a full answer review
- Report card with per-subject breakdown, trend chart and teacher remarks
- Day-by-day attendance record
- Notifications feed with unread badge

**Parent**
- Per-child dashboard (switcher appears when more than one child is enrolled)
- Attendance summary and full day-by-day record
- Progress report with performance trend and teacher remarks
- Fee status — outstanding amount, due dates, payment history
- Prominent alert when a fee is due or overdue
- Notifications feed (parent-relevant only)

**Administration**
- Dashboard: fees collected/pending, overdue list, low-attendance watchlist, batch overview
- Manage students, parents and batches (create, link parent↔child, remove)
- Fast single-screen attendance marking with an "all present" shortcut
- Upload study material (notes or links) per batch
- Build and publish multiple-choice quizzes; see who attempted and the batch average
- Enter marks and remarks that flow straight through to students and parents
- Fee ledger — add entries, record payments, one-tap reminder to all parents
- Post notifications targeted by audience (everyone / students / parents) and by batch

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Charts | Recharts |
| PWA | `vite-plugin-pwa` (Workbox) |
| Backend | Node.js + Express (REST API) |
| Database | PostgreSQL — Neon serverless Postgres in production, embedded PGlite locally |
| Hosting | Vercel — static PWA + the API as a serverless function (`api/index.js`) |
| Auth | bcrypt password hashes + JWT bearer tokens, role-based route guards |
| Language | JavaScript (no TypeScript) + SQL |

### Architecture

```
 Browser (React PWA)                     Node.js server                   Database
┌───────────────────────┐  HTTP + JSON  ┌───────────────────────────┐ SQL ┌──────────────┐
│ pages → src/data/db.js │ ────────────▶ │ Express REST routes       │ ──▶ │ PostgreSQL   │
│ in-memory snapshot     │ ◀──────────── │ JWT auth + role checks    │ ◀── │ 16 tables    │
└───────────────────────┘   JWT token    │ grading, overdue fees     │     └──────────────┘
                                         └───────────────────────────┘
```

- **Three tiers.** The React frontend never touches the database. It talks only to the REST API in
  [`server/index.js`](server/index.js), which reads and writes the relational schema in
  [`server/schema.sql`](server/schema.sql).
- **One login system, three roles.** Passwords are stored as bcrypt hashes. A successful login returns
  a signed JWT, which is sent with every request; middleware rejects missing or invalid tokens and
  restricts write routes to the admin role.
- **Role-scoped data.** After sign-in the client calls `GET /api/bootstrap` and receives only what that
  user may see: an admin gets everything, a student only their own batch and records, a parent only
  their children's. Quiz answer keys are withheld from students until they have submitted.
- **Business rules on the server.** Quiz grading, the overdue-fee check and cascading deletes (via
  `ON DELETE CASCADE` foreign keys) all happen server-side, so they cannot be tampered with from the
  browser.
- **The UI did not need rewriting.** Every screen already went through
  [`src/data/db.js`](src/data/db.js). That module now keeps the server snapshot in memory, so reads stay
  instant, and every write goes to the API and then refreshes the snapshot.
- **Shared data.** A change made by the admin on one device is visible to students and parents on any
  other device.

### REST API

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | anyone | Verify password, return JWT + user |
| GET | `/api/me` | signed in | Current user from token |
| GET | `/api/bootstrap` | signed in | Role-scoped snapshot of all data |
| GET | `/api/institute` | anyone | Institute name for the login screen |
| POST / DELETE | `/api/batches`, `/api/batches/:id` | admin | Create / remove a batch |
| POST / DELETE | `/api/students`, `/api/students/:id` | admin | Enrol / remove a student (cascades) |
| POST | `/api/parents` | admin | Create parent and link children |
| POST / DELETE | `/api/materials`, `/api/materials/:id` | admin | Study material |
| POST / DELETE | `/api/quizzes`, `/api/quizzes/:id` | admin | Publish / remove a quiz |
| POST | `/api/quizzes/:id/attempts` | student | Submit answers; graded on the server |
| PUT | `/api/attendance/:batchId/:date` | admin | Save a batch's register for a day |
| POST / DELETE | `/api/marks`, `/api/marks/:id` | admin | Report-card entries |
| POST | `/api/fees` | admin | Add a fee entry |
| POST | `/api/fees/:id/payments` | admin | Record a payment |
| POST / DELETE | `/api/notifications`, `/api/notifications/:id` | admin | Post / remove a notice |
| POST | `/api/notifications/read` | signed in | Mark notices as read |
| POST | `/api/admin/reset` | admin | Restore the demo dataset |

Every request is logged in the server terminal, so during a demo you can show each click in the app
producing an API call.

---

## Running locally

Requires **Node.js 20 or newer**. No database server or account is needed locally: without a
`DATABASE_URL`, the API uses PGlite, a full PostgreSQL engine that runs inside Node and stores its files
in `server/data/pglite/`.

```bash
npm install
npm run dev
```

This starts the API on `http://localhost:4000` and the Vite frontend on `http://localhost:5173`
(Vite forwards `/api` to the API). Open the frontend URL.

On first start the server creates the tables from [`server/schema.sql`](server/schema.sql) and loads the demo dataset.

```bash
npm run db:reset  # wipe the database, reload the demo data and start the API
npm run build     # production build into dist/
npm start         # one server on :4000 serving the API and the built app
npm run icons     # regenerate PWA icons from public/favicon.svg
```

To work against the real hosted database instead, put its connection string in `DATABASE_URL` before
running `npm run dev`.

> The service worker is disabled in dev (`devOptions.enabled: false`) so it doesn't cache
> your changes while you work. To test install behaviour, use `npm run build && npm start`.

---

## Deploying to Vercel (CI/CD)

Everything runs on Vercel: the built PWA is served as static files, and every `/api/*` request is
rewritten to one serverless function ([`api/index.js`](api/index.js)) that runs the same Express app.

One-time setup:

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new). Vercel
   auto-detects Vite; leave the defaults.
2. **Storage → Create Database → Neon** (free plan, Singapore region, to sit next to the function in
   `sin1`) and connect it to the project. This adds `DATABASE_URL`.
3. **Settings → Environment Variables:** add `JWT_SECRET` with any long random string.
4. Redeploy. On the first API request the function creates the tables and loads the demo data.

After that **every push to `main` deploys automatically.** Pull requests get their own preview URL.

`vercel.json` routes `/api/*` to the function, rewrites everything else to `index.html` so deep links
work on refresh, pins the function to the Singapore region, and sets cache headers: long-lived for
hashed assets, no-cache for the service worker so updates land immediately.

---

## Installing on your phone

1. Open the Vercel URL in **Chrome** (Android) or **Safari** (iOS).
2. **Android:** an "Install EduBridge" bar appears at the bottom — tap **Install**. You can also use
   the browser menu → *Install app* / *Add to Home screen*.
3. **iOS:** Safari never fires the install event, so the app shows manual instructions instead —
   tap **Share** → **Add to Home Screen**.
4. Launch it from the home-screen icon. It opens standalone, with no browser chrome.

Workbox precaches the app shell, so it opens instantly. The last data you saw is also kept on the device, so the installed app still opens and shows your dashboard with no signal. Signing in and saving changes need a connection.

> Installation requires HTTPS, which Vercel provides automatically. It will not offer to install over
> plain `http://` (except on `localhost`).

---

## Project structure

```
server/
├── app.js                  Express app: auth, role guards, all REST routes
├── index.js                runs the app as a local server (dev / npm start)
├── db.js                   Postgres connection (Neon or PGlite), seeding, role-scoped snapshot
├── schema.sql              relational schema (16 tables, foreign keys)
└── data/                   local PGlite database files (git-ignored)

api/
└── index.js                Vercel serverless entry — exports the Express app

src/
├── App.jsx                 route table + role guards
├── main.jsx                entry point
├── index.css               Tailwind layers and component classes
├── context/
│   └── AuthContext.jsx     session (JWT), bootstrap, change notifications
├── data/
│   ├── api.js              fetch wrapper: base URL, bearer token, errors
│   ├── db.js               THE data-access layer — snapshot cache + API writes
│   └── seed.js             demo dataset (used by the server to seed the database)
├── components/             shared UI (Layout, charts, modals, icons, …)
└── pages/
    ├── Login.jsx
    ├── Notifications.jsx   shared by all three roles
    ├── student/
    ├── parent/
    └── admin/
```

---

## Design documents

- [`PROJECT_PLAN.md`](PROJECT_PLAN.md) — problem statement, personas, data model, build phases
- [`UML_DIAGRAMS.md`](UML_DIAGRAMS.md) — Mermaid sources and draw.io notes
- `usecase_diagram.xml` / `activity_diagram.xml` — import via draw.io → **Extras → Edit Diagram**

---

## Known limitations

- **Demo-grade secrets.** The JWT secret has a development default. Set `JWT_SECRET` in the environment
  for anything beyond a local demo.
- **Cold starts.** The free tiers sleep when idle, so the first request after a while can take a
  couple of seconds.
- **No file uploads.** Study material is written notes or external links.
- **No push notifications.** Notices are in-app only, and fee reminders are sent manually by the admin.
