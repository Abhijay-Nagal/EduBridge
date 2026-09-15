import { useEffect, useState } from 'react'
import { DownloadIcon, XIcon } from './Icons'

const DISMISS_KEY = 'edubridge-install-dismissed'

// Shows an "Add to Home Screen" bar. Chrome/Edge/Android fire
// `beforeinstallprompt`; iOS Safari never does, so we show manual
// instructions there instead.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [showIosHint, setShowIosHint] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (isIos && !isStandalone) setShowIosHint(true)

    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const close = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (dismissed || (!deferred && !showIosHint)) return null

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-4">
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl bg-slate-900 p-3 text-white shadow-xl">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10">
          <DownloadIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Install EduBridge</p>
          <p className="truncate text-xs text-white/70">
            {deferred ? 'Add it to your home screen for quick access.' : 'Tap Share, then “Add to Home Screen”.'}
          </p>
        </div>
        {deferred && (
          <button
            onClick={async () => {
              deferred.prompt()
              await deferred.userChoice
              setDeferred(null)
            }}
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900"
          >
            Install
          </button>
        )}
        <button onClick={close} className="shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/10" aria-label="Dismiss">
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
