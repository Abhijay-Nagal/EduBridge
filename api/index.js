// Vercel serverless entry point. vercel.json rewrites every /api/* request
// here; the Express app routes it by its original path.

import app from '../server/app.js'

export default app
