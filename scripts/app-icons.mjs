// Makes the home-screen icons from the MEGS' mark: the crowned face in gold on black, like the cup
// sticker. Run again if the logo changes:  node scripts/app-icons.mjs
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const mark = join(app, 'src/assets/brand/megs-mark.webp')
const out = join(app, 'public/icons')
mkdirSync(out, { recursive: true })

const INK = '#141414'
const GOLD = '#cdae54'

/** The mark tinted gold, at a given width */
async function goldMark(width) {
  const m = await sharp(mark).resize({ width }).png().toBuffer()
  const { height } = await sharp(m).metadata()
  return sharp({ create: { width, height, channels: 4, background: GOLD } })
    .composite([{ input: m, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

/** A square icon: the mark at `scale` of the side, centred on black */
async function icon(file, size, scale) {
  const g = await goldMark(Math.round(size * scale))
  await sharp({ create: { width: size, height: size, channels: 4, background: INK } })
    .composite([{ input: g, gravity: 'centre' }])
    .png()
    .toFile(join(out, file))
}

await icon('icon-192.png', 192, 0.72)
await icon('icon-512.png', 512, 0.72)
// Android crops maskable icons to a circle or squircle: keep the mark inside the safe zone
await icon('maskable-512.png', 512, 0.56)
await icon('apple-touch-icon.png', 180, 0.7)
console.log('public/icons: icon-192, icon-512, maskable-512, apple-touch-icon')
