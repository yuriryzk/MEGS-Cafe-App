// Connection state for the offline banners (SRS 3.2.1.5, 3.2.2.5, 3.2.5.5, NFR-REL-04).
// Demo switch: `?offline=1` before the # (`/?offline=1#/home`) shows the whole visit offline;
// after it (`#/home?offline=1`) shows just that screen offline. Nothing needs unplugging.
import { useSyncExternalStore } from 'react'
import { reloadShared } from './shared'

const forced = () => {
  const inHash = window.location.hash.split('?')[1] ?? ''
  return (
    new URLSearchParams(window.location.search).get('offline') === '1' || new URLSearchParams(inHash).get('offline') === '1'
  )
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function subscribe(l: () => void) {
  listeners.add(l)
  window.addEventListener('online', emit)
  window.addEventListener('offline', emit)
  window.addEventListener('hashchange', emit)
  return () => {
    listeners.delete(l)
    window.removeEventListener('online', emit)
    window.removeEventListener('offline', emit)
    window.removeEventListener('hashchange', emit)
  }
}

const snapshot = () => navigator.onLine && !forced()

/** True while the phone has a connection */
export function useOnline() {
  return useSyncExternalStore(subscribe, snapshot)
}

/** Retry: check the connection again and re-read the latest saved state */
export function retryConnection() {
  if (snapshot()) reloadShared()
  emit()
}
