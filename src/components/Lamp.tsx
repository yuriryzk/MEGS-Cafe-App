// The cafe's black enamel wall lamp, hung from its conduit. The app's one signature mark:
// a lamp that is lit is the only place gold appears as light.

export type LampState = 'off' | 'done' | 'lit'

/**
 * off  — an outline shade, nothing happening yet
 * done — a filled shade, a step that has passed
 * lit  — a filled shade with its gold bulb and the pool of light under it (the current step)
 * The shade takes `currentColor`, so the same lamp works on concrete and on the black panels.
 */
export function Lamp({ state, size = 28, label }: { state: LampState; size?: number; label?: string }) {
  const h = (size * 32) / 28
  return (
    <svg
      className={`lamp lamp--${state}`}
      width={size}
      height={h}
      viewBox="0 0 28 32"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {state === 'lit' && <path className="lamp__pool" d="M9 17.5L3 32h22l-6-14.5z" fill="var(--gold)" opacity="0.32" />}
      <path d="M14 0v7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 16.5C5 11 8.6 7.5 14 7.5S23 11 23 16.5z"
        fill={state === 'off' ? 'var(--lamp-bg, var(--surface))' : 'currentColor'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M3.5 16.5h21" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      {state === 'lit' && <circle cx="14" cy="19" r="3.2" fill="var(--gold)" />}
    </svg>
  )
}
