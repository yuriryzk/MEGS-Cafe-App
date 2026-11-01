// Menu catalogue, read from the cafe's data sheet (data-sheet/*.csv) at build time.
// The sheet is the source of truth: edit the CSVs, not this file.
import productsCsv from '../../data-sheet/products.csv?raw'
import sectionsCsv from '../../data-sheet/sections.csv?raw'
import groupsCsv from '../../data-sheet/option_groups.csv?raw'
import choicesCsv from '../../data-sheet/option_choices.csv?raw'

// Menu photos made by scripts/menu-photos.mjs; the sheet's image column names the file.
const photoUrls = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/menu/*.webp', { eager: true, query: '?url', import: 'default' }),
  ).map(([path, url]) => [path.split('/').pop()!, url]),
)

/* ----- CSV ----- */

type Row = Record<string, string>

/** Parses a comma-separated sheet with a header row; handles quoted cells and a UTF-8 BOM. */
function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const src = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim())) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim())) rows.push(row)
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const yes = (v: string) => v.toLowerCase() === 'yes'
const num = (v: string) => (v === '' ? undefined : Number(v))
const list = (v: string) => v.split(',').map((s) => s.trim()).filter(Boolean)
const bySort = (a: Row, b: Row) => Number(a.sort_order) - Number(b.sort_order)

/* ----- Sections ----- */

export type Section = string

export type SectionInfo = {
  id: Section
  title: string
  /** Label on the menu tabs. */
  tab: string
  /** Coffee, Non-Coffee or Food; empty for collections. */
  group: string
  /** A collection lists every product whose badges include this one. */
  badge?: string
}

export const sections: SectionInfo[] = parseCsv(sectionsCsv)
  .sort(bySort)
  .map((r) => {
    const badge = r.kind.match(/badge includes (.+)$/)?.[1]
    return { id: r.id, title: r.title, tab: r.title, group: r.menu_group, badge }
  })

/** The printed menu's boards, in order (collections excluded). */
export const boards = sections.filter((s) => !s.badge)
/** Best Sellers, Must-Try, Kids' Favorites: built from the badge column. */
export const collections = sections.filter((s) => s.badge)

/* ----- Products ----- */

export type Size = { label: string; price: number }

export type Product = {
  id: string
  name: string
  /** Short line shown on list rows; falls back to the description or the sizes. */
  blurb: string
  /** Longer copy on the product detail screen. */
  description: string
  /** Lowest price the item sells for: the menu row price and "From" on the product page. */
  price: number
  /** Highest size price; equals price when the item has one price. */
  priceMax: number
  /** Every badge printed for the item; the first one shows on menu rows. */
  badges: string[]
  badge?: string
  isNew?: boolean
  /** The menu board the item is printed on. */
  section: Section
  kind: 'drink' | 'food'
  /** Temperatures a drink comes in (used by the Hot/Iced filter chips). */
  temps?: ('Hot' | 'Iced')[]
  /** Drink sizes with their own prices, cheapest first. */
  sizes: Size[]
  available: boolean
  /** Menu photo URL; items without one show a placeholder tile. */
  image?: string
  /** The raw sheet row, for the option rules in option_groups.csv. */
  row: Row
}

const choiceRows = parseCsv(choicesCsv).sort(bySort)
const sizeChoices = choiceRows.filter((c) => c.group === 'size')

function toProduct(r: Row): Product {
  const sizes = sizeChoices
    .map((c) => ({ label: c.label, price: num(r[c.price_from] ?? '') }))
    .filter((s): s is Size => s.price !== undefined)
  const prices = sizes.length ? sizes.map((s) => s.price) : [num(r.price) ?? 0]
  const temps: ('Hot' | 'Iced')[] = []
  if (sizes.some((s) => s.label.startsWith('Cold'))) temps.push('Iced')
  if (sizes.some((s) => s.label.startsWith('Hot'))) temps.push('Hot')
  const badges = list(r.badge)
  const kind = r.kind === 'food' ? 'food' : 'drink'
  const sizeLine = temps.length === 2 ? 'Cold or hot' : temps[0] === 'Hot' ? 'Hot only' : temps.length ? 'Cold only' : ''
  return {
    id: r.id,
    name: r.name,
    blurb: r.blurb || r.description || sizeLine,
    description: r.description,
    price: Math.min(...prices),
    priceMax: Math.max(...prices),
    badges,
    badge: badges[0],
    isNew: yes(r.is_new),
    section: r.section,
    kind,
    temps: kind === 'drink' ? temps : undefined,
    sizes: [...sizes].sort((a, b) => a.price - b.price),
    available: yes(r.is_available),
    image: photoUrls[r.image],
    row: r,
  }
}

export const products: Product[] = parseCsv(productsCsv)
  .filter((r) => yes(r.is_active))
  .sort(bySort)
  .map(toProduct)

/** Availability as printed on the sheet, before staff mark anything sold out */
const sheetAvailable = new Map(products.map((p) => [p.id, p.available]))

/** SRS FR-OPS-04: staff overrides (A-10 Item availability) laid over the sheet. Called by the shared
 *  store whenever its settings change, so every screen reads `product.available` as it is right now. */
export function applyAvailability(overrides: Record<string, { available: boolean }>) {
  for (const p of products) p.available = overrides[p.id]?.available ?? sheetAvailable.get(p.id) ?? true
}

export const productById = (id: string) => products.find((p) => p.id === id)

/** Items off the menu right now — reordering them triggers O-08 "Some items aren't available". */
export const isUnavailable = (id: string) => !productById(id)?.available
export const sectionById = (id: string) => sections.find((s) => s.id === id)
export const productsIn = (id: Section) => {
  const s = sectionById(id)
  return s?.badge ? products.filter((p) => p.badges.includes(s.badge!)) : products.filter((p) => p.section === id)
}

/* ----- Options (C-13 Product Detail) ----- */

export type Choice = { label: string; delta: number; badge?: string; isDefault?: boolean }
export type OptionGroup = {
  id: string
  title: string
  required: boolean
  pick: 'one' | 'many'
  choices: Choice[]
}

const groupRows = parseCsv(groupsCsv).sort(bySort)

/** "section=pastas|snacks" → the product's section column is one of those values. */
const applies = (rule: string, p: Product) => {
  const [col, values] = rule.split('=')
  return !!values && values.split('|').includes(p.row[col.trim()] ?? '')
}

/** The option groups a product shows, in sheet order. Size prices become deltas over the item's lowest price. */
export function optionGroupsFor(p: Product): OptionGroup[] {
  return groupRows
    .filter((g) => applies(g.applies_to, p))
    .map((g) => {
      const choices: Choice[] =
        g.id === 'size'
          ? p.sizes.map((s) => ({
              label: s.label,
              delta: s.price - p.price,
              isDefault: sizeChoices.find((c) => c.label === s.label)?.is_default === 'yes',
            }))
          : choiceRows
              .filter((c) => c.group === g.id && yes(c.is_available))
              .map((c) => ({ label: c.label, delta: num(c.price_add) ?? 0, badge: c.badge || undefined, isDefault: yes(c.is_default) }))
      return { id: g.id, title: g.title, required: yes(g.required), pick: (g.pick === 'many' ? 'many' : 'one') as OptionGroup['pick'], choices }
    })
    .filter((g) => g.choices.length > 0)
}

/** Default pick in a one-choice group: the sheet's default, else the cheapest (first on a tie). */
export function defaultChoice(g: OptionGroup) {
  const marked = g.choices.findIndex((c) => c.isDefault)
  if (marked >= 0) return marked
  const min = Math.min(...g.choices.map((c) => c.delta))
  return g.choices.findIndex((c) => c.delta === min)
}

/** The item as it comes by default: default choices picked, no add-ons. */
export function defaultOrder(productId: string) {
  const p = productById(productId)!
  const options = optionGroupsFor(p)
    .filter((g) => g.pick === 'one')
    .map((g) => g.choices[defaultChoice(g)])
  return {
    productId,
    options: options.map((c) => c.label),
    unitPrice: p.price + options.reduce((s, c) => s + c.delta, 0),
  }
}

// SRS 2.4: Philippine peso, tax-inclusive, 2 decimal places
export const peso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Today's price for an item with these options (reorders use current prices, SRS FR-ROR-03) */
export function priceFor(productId: string, options: string[]) {
  const p = productById(productId)
  if (!p) return undefined
  const extra = optionGroupsFor(p)
    .flatMap((g) => g.choices)
    .filter((c) => options.includes(c.label))
    .reduce((s, c) => s + c.delta, 0)
  return p.price + extra
}
