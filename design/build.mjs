// Builds design/redesign.html from redesign.template.html with the menu photos and the logo
// inlined, so the page opens on its own from the file system:  node design/build.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = join(here, '..')
const dataUri = (file) => `data:image/webp;base64,${readFileSync(file).toString('base64')}`

const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.8l-5.3 2.8 1.1-5.8-4.3-4.1 5.9-.8z"/></svg>'
// The app's lit wall lamp (src/components/Lamp.tsx): white shade, gold bulb and pool
const lamp =
  '<svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2v7" stroke="#e9e9e6" stroke-width="1.6"/>' +
  '<path d="M6 19a10 10 0 0 1 20 0z" fill="#e9e9e6"/><circle cx="16" cy="21" r="2.6" fill="#cdae54"/>' +
  '<path d="M9 24h14l4 7H5z" fill="#cdae54" opacity=".32"/></svg>'

const html = readFileSync(join(here, 'redesign.template.html'), 'utf8')
  .replace(/\{\{img:([a-z0-9-]+)\}\}/g, (_, id) => dataUri(join(app, 'src/assets/menu', `${id}.webp`)))
  .replaceAll('{{mark}}', dataUri(join(here, 'megs-mark-gold.webp')))
  .replaceAll('{{star}}', star)
  .replaceAll('{{lamp}}', lamp)
writeFileSync(join(here, 'redesign.html'), html)
console.log(`design/redesign.html · ${Math.round(html.length / 1024)} KB`)
