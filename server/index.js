// Runs the EduBridge API as a normal Node server.
//
//   npm run server             → API on http://localhost:4000
//   npm run dev                → API + Vite frontend together (Vite proxies /api)
//   npm run build && npm start → one server for the API and the built frontend
//   npm run db:reset           → reload the demo dataset, then start the API

import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.js'
import { init, resetDemoData } from './db.js'

const PORT = Number(process.env.PORT) || 4000

await init()
if (process.argv.includes('--reset')) {
  await resetDemoData()
  console.log('Demo data restored.')
}

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (req, res) => res.sendFile(join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`EduBridge API listening on http://localhost:${PORT}`)
})
