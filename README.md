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
| Persistence | IndexedDB via `idb-keyval` |
| Language | JavaScript (no TypeScript) |
| Hosting | Vercel |

### About the data layer

All data lives in the browser's IndexedDB, seeded on first launch. Everything routes through
[`src/data/db.js`](src/data/db.js), which is the single data-access layer — no component talks to
storage directly.

This means the app is **fully functional with zero backend setup**, which is what makes the one-link
Vercel deploy work. The trade-off is that data is per-device: changes an admin makes on a laptop will
not appear on a phone, because they are different browsers.

Moving to a shared backend (Supabase was the plan) means reimplementing the functions in `db.js`
against it. No component changes are required — that isolation was deliberate.

---

## Running locally

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:5173`).

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run icons     # regenerate PWA icons from public/favicon.svg
```

> The service worker is disabled in dev (`devOptions.enabled: false`) so it doesn't cache
> your changes while you work. Install/offline behaviour only applies to the built app —
> test it with `npm run preview`, not `npm run dev`.

---

## Deploying to Vercel (CI/CD)

One-time setup:

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Vercel auto-detects Vite — leave the defaults:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

After that it's automatic: **every push to `main` triggers a new deployment.** Pull requests get
their own preview URL.

`vercel.json` handles the SPA rewrite (so deep links like `/student/quizzes` work on refresh) and
sets cache headers — long-lived for hashed assets, no-cache for the service worker so updates land
immediately.

---

## Installing on your phone

1. Open the Vercel URL in **Chrome** (Android) or **Safari** (iOS).
2. **Android:** an "Install EduBridge" bar appears at the bottom — tap **Install**. You can also use
   the browser menu → *Install app* / *Add to Home screen*.
3. **iOS:** Safari never fires the install event, so the app shows manual instructions instead —
   tap **Share** → **Add to Home Screen**.
4. Launch it from the home-screen icon. It opens standalone, with no browser chrome.

The app works offline after the first load — Workbox precaches the shell, and all data is local anyway.

> Installation requires HTTPS, which Vercel provides automatically. It will not offer to install over
> plain `http://` (except on `localhost`).

---

## Project structure

```
src/
├── App.jsx                 route table + role guards
├── main.jsx                entry point
├── index.css               Tailwind layers and component classes
├── context/
│   └── AuthContext.jsx     session, DB bootstrap, change notifications
├── data/
│   ├── db.js               THE data-access layer — swap this for a real backend
│   └── seed.js             demo dataset
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

- **Data is per-device.** There is no shared server, so two devices do not see each other's changes.
- **Passwords are stored in plain text** in the local database. Acceptable for a local-only demo;
  must be replaced with proper hashing before any real deployment.
- **No file uploads.** Study material is written notes or external links. Real file storage needs a
  backend bucket.
- Resetting browser site data wipes everything and re-seeds on next load.
