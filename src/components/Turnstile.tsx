import { useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      theme?: 'light' | 'dark' | 'auto'
      callback?: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
    },
  ) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  const existing = document.getElementById(SCRIPT_ID)
  if (existing) {
    const { promise, resolve, reject } = Promise.withResolvers<void>()
    existing.addEventListener('load', () => resolve(), { once: true })
    existing.addEventListener('error', () => reject(new Error('load')), {
      once: true,
    })
    return promise
  }
  const { promise, resolve, reject } = Promise.withResolvers<void>()
  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.src = SCRIPT_SRC
  script.async = true
  script.defer = true
  script.addEventListener('load', () => resolve(), { once: true })
  script.addEventListener('error', () => reject(new Error('load')), {
    once: true,
  })
  document.head.appendChild(script)
  return promise
}

export function Turnstile({
  siteKey,
  onToken,
  resetSignal = 0,
}: {
  siteKey: string
  onToken: (token: string | null) => void
  resetSignal?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tokenRef = useRef(onToken)
  const [loaded, setLoaded] = useState(false)
  tokenRef.current = onToken

  useEffect(() => {
    let cancelled = false
    let widgetId: string | undefined

    loadTurnstile()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        containerRef.current.replaceChildren()
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token) => tokenRef.current(token),
          'expired-callback': () => tokenRef.current(null),
          'error-callback': () => tokenRef.current(null),
        })
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) tokenRef.current(null)
      })

    return () => {
      cancelled = true
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId)
        } catch {
          // The widget may already be gone after a navigation.
        }
      }
    }
  }, [siteKey, resetSignal])

  return (
    <div className="turnstile-field">
      <div ref={containerRef} className="turnstile-widget" />
      <p className="field-note">
        {loaded
          ? 'Protected by Cloudflare Turnstile.'
          : 'The verification widget loads when JavaScript is available.'}
      </p>
    </div>
  )
}
