// Converts the cafe's menu photos into small WebP files the app ships, and points the
// data sheet's image column at them. Run again after adding or replacing a photo:
//   node scripts/menu-photos.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const app = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(app, '..', 'MEGS MENU (Pictures)')
const out = join(app, 'src', 'assets', 'menu')
const sheet = join(app, 'data-sheet', 'products.csv')

// Photo file (relative to the photo folder) → product id(s). Folders "YWalaSaMenu" (not on
// the menu) and "ZHindiNeed" (not needed) are left out on purpose.
const photos = {
  'Coffee Series/Espresso/CloudyHazelnut.png': ['cloudy-hazelnut'],
  'Coffee Series/Espresso/HotMochaHazelnut.png': ['mocha-hazelnut'],
  'Coffee Series/Espresso/HotToastedMocha.png': ['toasted-mocha'],
  'Coffee Series/Espresso/MatchaCoffee.png': ['matcha-coffee'],
  'Coffee Series/Espresso/SpanishMatchaCoffee.png': ['spanish-matcha-coffee'],
  'Coffee Series/Espresso/WhiteMocha.png': ['white-mocha'],
  'Coffee Series/Espresso/WhiteMochaMallows.png': ['white-mocha-mallows'],
  'Coffee Series/Oat Series/OatCoffee.png': ['oat-coffee'],
  'Coffee Series/Oat Series/SpanishOatCoffee.png': ['spanish-oat-coffee'],
  'Coffee Series/Oat Series/MacadamiaOatCoffee.png': ['macadamia-oat-coffee'],
  'Coffee Series/Oat Series/MochaMacadamiaOatCoffee.png': ['mocha-macadamia-oat-coffee'],
  'Coffee Series/Oat Series/CaramelMochamacadamiaOatCoffee.png': ['caramel-mocha-macadamia-oat-coffee'],
  'Coffee Series/Strong Coffee/HotLatte.png': ['latte'],
  'Coffee Series/Strong Coffee/HotSpanishLatte.png': ['spanish-latte'],
  'Coffee Series/Strong Coffee/VietnameseCoffee.png': ['vietnamese'],
  'Coffee Series/Strong Coffee/Americano.png': ['americano'],
  'Coffee Series/Strong Coffee/WhiteAmericano.png': ['white-americano'],
  'Coffee Series/Caramel Series/CaramelMachiato.png': ['caramel-macchiato'],
  'Coffee Series/Caramel Series/CaramelMocha.png': ['caramel-mocha'],
  'Coffee Series/Caramel Series/CaramelMochaMacadamia.png': ['caramel-mocha-macadamia'],
  'Coffee Series/Caramel Series/CloudyCaramelMacchiato.png': ['cloudy-caramel-macchiato'],
  'Coffee Series/Caramel Series/ToastedCaramel.png': ['toasted-caramel'],
  'Coffee Series/Caramel Series/SpanishSaltedCaramel.png': ['spanish-salted-caramel'],
  'Non coffee Series/Non Coffee/ChocoLava.png': ['choco-lava'],
  'Non coffee Series/Non Coffee/ChocoBerry.png': ['choco-berry'],
  'Non coffee Series/Non Coffee/UbeLava.png': ['ube-lava'],
  'Non coffee Series/Non Coffee/MilkyUbe.png': ['milky-ube'],
  'Non coffee Series/Non Coffee/RedVelvetLava.png': ['red-velvet-lava'],
  'Non coffee Series/Non Coffee/BlueBerryLava.png': ['blueberry-lava'],
  'Non coffee Series/Oat Series/ChocoLavaOat.png': ['choco-lava-oat'],
  'Non coffee Series/Oat Series/StrawberryOatMilk.png': ['strawberry-oat'],
  'Non coffee Series/Oat Series/MatchaMacadamiaOat.png': ['matcha-macadamia-oat'],
  'Non coffee Series/Matcha Series/MatchaLava.png': ['matcha-lava'],
  'Non coffee Series/Matcha Series/SpanishMatchaLava.png': ['spanish-matcha-lava'],
  'Non coffee Series/Matcha Series/ChocoMatcha.png': ['choco-matcha'],
  'Non coffee Series/Matcha Series/StrawberryMatcha.png': ['straw-matcha'],
  'Non coffee Series/Matcha Series/UbeMatcha.png': ['ube-matcha'],
  'Non coffee Series/Matcha Series/MatchaMacadamia.png': ['matcha-macadamia'],
  'Non coffee Series/Soda-Based/RubySoda.png': ['ruby-soda'],
  'Non coffee Series/Soda-Based/SapphireSoda.png': ['sapphire-soda'],
  'Non coffee Series/Hot Drinks/HotChocolate.png': ['hot-chocolate'],
  'RiceMeals/HungarianSausage.png': ['hungarian-sausage'],
  'RiceMeals/CornBeef.png': ['corned-beef'],
  'RiceMeals/BurgerSteak.png': ['burger-steak'],
  'RiceMeals/PorkChop.png': ['porkchop'],
  'RiceMeals/BeefTapa.png': ['beef-tapa'],
  'RiceMeals/JapaneseTonkatsuCurry.jpg': ['tonkatsu-curry'],
  'Pastas/Carbonara.png': ['carbonara'],
  'Pastas/Spaghetti Bolognese.png': ['spaghetti-bolognese'],
  'Pastas/AglioOlio.png': ['aglio-olio'],
  'Snacks/PotatoFries.png': ['potato-fries-plain', 'potato-fries-flavored'],
  'Snacks/CheeseConFries.png': ['cheese-con-fries'],
  'Snacks/Nachos.png': ['nachos'],
  'ChickenDelights/ChickenPopcorn.png': ['chicken-popcorn'],
  'ChickenDelights/ChickenWings.png': ['chicken-wings-classic', 'chicken-wings-flavored'],
}

mkdirSync(out, { recursive: true })
const images = new Map()
for (const [file, ids] of Object.entries(photos)) {
  const from = join(source, file)
  if (!existsSync(from)) throw new Error(`Missing photo: ${file}`)
  const name = `${ids[0]}.webp`
  // 640px covers the product page at 2x; transparency is kept for the cut-outs
  await sharp(from).resize(640, 640, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(join(out, name))
  for (const id of ids) images.set(id, name)
}

// Point the sheet's image column at the files; items with no photo get a blank cell
const text = readFileSync(sheet, 'utf8').replace(/^﻿/, '')
const lines = text.split(/\r\n/).filter(Boolean)
const head = lines[0].split(',')
const idCol = head.indexOf('id')
const imageCol = head.indexOf('image')
const split = (l) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).slice(0, -1).map((c) => c.replace(/,$/, ''))
const body = lines.slice(1).map((l) => {
  const cells = split(l)
  cells[imageCol] = images.get(cells[idCol]) ?? ''
  return cells.join(',')
})
writeFileSync(sheet, '﻿' + [lines[0], ...body].join('\r\n') + '\r\n')

const missing = body.map(split).filter((c) => !c[imageCol]).map((c) => c[idCol])
console.log(`${images.size} items have a photo (${Object.keys(photos).length} files). No photo yet: ${missing.join(', ')}`)
