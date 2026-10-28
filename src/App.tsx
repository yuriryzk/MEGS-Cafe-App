import { useEffect, useState } from 'react'
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AppStateProvider, useApp } from './state/AppState'
import { index, overlayIndex, routes } from './routes'
import { ComingSoon } from './screens/shop'
import { OverlayHost, useOverlay } from './overlays/OverlayHost'
import './app-shell.css'

/** Shrinks the 852px-tall phone frame to fit short desktop windows. */
function usePhoneScale() {
  const fit = () => Math.min(1, (window.innerHeight - 48) / 852)
  const [scale, setScale] = useState(fit)
  useEffect(() => {
    const onResize = () => setScale(fit())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return scale
}

/** Left-hand list of every Figma frame; clicking one jumps the phone to that screen/state. */
function ScreenIndex() {
  const app = useApp()
  const overlay = useOverlay()
  const navigate = useNavigate()
  const location = useLocation()
  const here = location.pathname + location.search
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <nav className="shell__index" aria-label="Screens">
      <p className="shell__brand">MEGS' Cafe · prototype</p>
      {[...index, overlayIndex].map((g) => (
        <section key={g.title}>
          <h2>{g.title}</h2>
          <ul>
            {g.entries.map((e) => {
              const id = `${e.code}${e.label}`
              const active = e.to === here && (picked === null || picked === id)
              return (
                <li key={id}>
                  <a
                    href={`#${e.to}`}
                    className={active ? 'active' : ''}
                    onClick={(ev) => {
                      ev.preventDefault()
                      overlay.close()
                      e.prep?.(app)
                      setPicked(id)
                      navigate(e.to)
                      if (e.overlay) setTimeout(() => overlay.open(e.overlay!, e.overlayData), 50)
                    }}
                  >
                    <span className="shell__code">{e.code}</span>
                    {e.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

/** Prototype shell: a 393×852 phone frame plus a screen index for jumping between Figma frames. */
export default function App() {
  const scale = usePhoneScale()
  return (
    <HashRouter>
      <AppStateProvider>
        <OverlayHost>
          <div className="shell">
            <ScreenIndex />
            <main className="shell__stage">
              <div id="phone" className="phone" style={{ ['--phone-scale' as string]: scale }}>
                <Routes>
                  {routes.map((r) => (
                    <Route key={r.path} path={r.path} element={r.element} />
                  ))}
                  <Route path="*" element={<ComingSoon title="Coming soon" />} />
                </Routes>
              </div>
            </main>
          </div>
        </OverlayHost>
      </AppStateProvider>
    </HashRouter>
  )
}
